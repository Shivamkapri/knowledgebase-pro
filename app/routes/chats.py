from __future__ import annotations

import datetime
import re
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from ..db import get_db
from ..llm import get_chat_model, get_embeddings
from ..vector_store import get_vector_store
from ..search_fix import serpapi_search

router = APIRouter(prefix="/chats", tags=["chats"])


class ChatCreate(BaseModel):
    title: Optional[str] = Field(default="New chat")


class MessageCreate(BaseModel):
    content: str = Field(min_length=1)
    top_k: int = Field(default=4, ge=1, le=20)
    temperature: float = Field(default=0.3, ge=0.0, le=1.0)  # Slightly higher for more varied responses
    max_tokens: Optional[int] = Field(default=1000, ge=100, le=4000)  # Allow longer responses


class FeedbackPayload(BaseModel):
    feedback: Literal["like", "dislike"]


def oid_to_str(d: dict) -> dict:
    d = dict(d)
    if "_id" in d:
        d["id"] = str(d["_id"])
        del d["_id"]
    return d


@router.get("")
async def list_chats():
    db = get_db()
    cursor = db.chats.find().sort("updated_at", -1)
    items = []
    async for c in cursor:
        items.append(oid_to_str(c))
    return items


@router.post("")
async def create_chat(payload: ChatCreate):
    db = get_db()
    now = datetime.datetime.utcnow()
    doc = {"title": payload.title, "created_at": now, "updated_at": now}
    res = await db.chats.insert_one(doc)
    # fetch the created document and sanitize ObjectId
    created = await db.chats.find_one({"_id": res.inserted_id})
    return oid_to_str(created)


@router.get("/{chat_id}")
async def get_chat(chat_id: str):
    db = get_db()
    c = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Chat not found")
    msgs = []
    cursor = db.messages.find({"chat_id": chat_id}).sort("created_at", 1)
    async for m in cursor:
        m = oid_to_str(m)
        msgs.append(m)
    c = oid_to_str(c)
    c["messages"] = msgs
    return c


@router.delete("/{chat_id}")
async def delete_chat(chat_id: str):
    db = get_db()
    await db.chats.delete_one({"_id": ObjectId(chat_id)})
    await db.messages.delete_many({"chat_id": chat_id})
    return {"deleted": True}


@router.post("/{chat_id}/messages")
async def post_message(chat_id: str, payload: MessageCreate):
    db = get_db()
    # ensure chat exists
    c = await db.chats.find_one({"_id": ObjectId(chat_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Chat not found")

    now = datetime.datetime.utcnow()
    user_msg = {
        "chat_id": chat_id,
        "role": "user",
        "content": payload.content,
        "created_at": now,
    }
    await db.messages.insert_one(user_msg)
    # retrieve recent messages (last 10) in chronological order
    cursor = db.messages.find({"chat_id": chat_id}).sort("created_at", -1).limit(10)
    recent_rev = []
    async for m in cursor:
        recent_rev.append(m)
    recent = list(reversed(recent_rev))

    # retrieval from vector store
    embeddings = get_embeddings()
    vs = get_vector_store(embeddings)
    # Build a retrieval query from the current question plus recent messages (user + assistant)
    last_user_msgs = [m.get("content") for m in recent if m.get("role") == "user"]
    last_assistant_msgs = [m.get("content") for m in recent if m.get("role") == "assistant"]
    # include up to the last 3 user and last 2 assistant messages to provide context
    parts = []
    if last_user_msgs:
        parts.append(" ".join(last_user_msgs[-3:]))
    if last_assistant_msgs:
        parts.append(" ".join(last_assistant_msgs[-2:]))
    parts.append(payload.content)
    retrieval_query = " ".join(parts)
    try:
        # Use Chroma's similarity_search_with_score to get relevance scores
        docs_with_scores = vs.similarity_search_with_score(retrieval_query, k=payload.top_k)
        # Filter out results with low relevance (distance > 0.8 means quite irrelevant)
        relevant_docs = [(doc, score) for doc, score in docs_with_scores if score < 0.8]
        docs = [doc for doc, score in relevant_docs]
        
        
    except Exception as e:
        try:
            # fallback to regular similarity_search if score version fails
            docs = vs.similarity_search(retrieval_query, k=payload.top_k)
        except Exception:
            # final fallback to retriever if similarity_search isn't available
            retriever = vs.as_retriever(search_kwargs={"k": payload.top_k})
            docs = retriever.invoke(payload.content)

    # If no relevant local docs were found, try a web search fallback (SerpAPI) if configured
    if not docs:
        try:
            web_docs = serpapi_search(retrieval_query, num=payload.top_k)
            if web_docs:
                docs = web_docs
        except Exception as e:
            # ignore web search failures; proceed with empty docs (LLM may still answer)
            pass

    # build prompt
    system_instruction = (
        "You are a helpful and knowledgeable assistant. Use ONLY the information provided in the Context (documents) and the Conversation history below to answer. "
        "Do NOT invent facts. If the answer cannot be found in the provided context, respond: 'I don't know'. "
        "Provide comprehensive, detailed, and thorough answers. Explain concepts clearly with examples when possible. "
        "Include relevant background information, step-by-step explanations, and practical insights from the provided sources. "
        "Always cite sources when possible (e.g., [Source 1]). For follow-up questions, use the conversation history to resolve references "
        "(for example, 'tell more' should refer to the previous topic and expand on it with additional details from the sources)."
    )

    # Format recent messages clearly as a conversation (oldest -> newest)
    history_lines = []
    for m in recent:
        role = (m.get("role") or "user").capitalize()
        content = m.get("content") or ""
        history_lines.append(f"{role}: {content}")
    history = "\n".join(history_lines)
    # Include concise excerpts from retrieved documents to give the model clear facts
    doc_blocks = []
    for i, d in enumerate(docs, start=1):
        src = d.metadata.get("source") if hasattr(d, "metadata") else None
        excerpt = (d.page_content[:500] + "...") if len(d.page_content) > 500 else d.page_content
        doc_blocks.append(f"[Source {i}: {src}]\n{excerpt}")
    docs_context = "\n\n".join(doc_blocks)

    prompt = (
        f"{system_instruction}\n\n"
        f"Context:\n{docs_context}\n\n"
        f"Conversation history:\n{history}\n\n"
        f"User: {payload.content}\n\n"
        f"Please provide a detailed, comprehensive response (aim for {payload.max_tokens} tokens or more when appropriate). "
        f"Include explanations, examples, and thorough coverage of the topic based on the available sources.\n\n"
        f"Assistant:"
    )

    llm = get_chat_model(temperature=payload.temperature)
    response = llm.invoke(prompt)
    answer = response.content if hasattr(response, "content") else str(response)

    # If the LLM says it doesn't know and we have web search available, try web search
    if ("don't know" in answer.lower() or "do not know" in answer.lower() or 
        "cannot be found" in answer.lower() or "not contain" in answer.lower()):
        try:
            web_docs = serpapi_search(payload.content, num=3)
            if web_docs:
                # Rebuild prompt with web sources
                web_doc_blocks = []
                for i, d in enumerate(web_docs, start=1):
                    src = d.metadata.get("source") if hasattr(d, "metadata") else None
                    excerpt = (d.page_content[:500] + "...") if len(d.page_content) > 500 else d.page_content
                    web_doc_blocks.append(f"[Web Source {i}: {src}]\n{excerpt}")
                web_docs_context = "\n\n".join(web_doc_blocks)
                
                web_prompt = (
                    f"{system_instruction}\n\n"
                    f"Context (from web search):\n{web_docs_context}\n\n"
                    f"Conversation history:\n{history}\n\n"
                    f"User: {payload.content}\n\n"
                    f"Please provide a detailed, comprehensive response based on the web search results above.\n\n"
                    f"Assistant:"
                )
                
                web_response = llm.invoke(web_prompt)
                web_answer = web_response.content if hasattr(web_response, "content") else str(web_response)
                
                # Use web answer and sources if it's more informative
                if len(web_answer) > 50 and "don't know" not in web_answer.lower():
                    answer = web_answer
                    docs = web_docs
        except Exception:
            # Ignore web search failures, keep original answer
            pass

    assistant_msg = {
        "chat_id": chat_id,
        "role": "assistant",
        "content": answer,
        "created_at": datetime.datetime.utcnow(),
        "sources": [
            {"source": d.metadata.get("source") if hasattr(d, "metadata") else None, "content": d.page_content}
            for d in docs
        ],
    }
    await db.messages.insert_one(assistant_msg)
    await db.chats.update_one({"_id": ObjectId(chat_id)}, {"$set": {"updated_at": datetime.datetime.utcnow()}})

    # Auto-generate a chat title if the chat still has the default title
    updated_title = None
    chat_doc = await db.chats.find_one({"_id": ObjectId(chat_id)})
    cur_title = chat_doc.get("title") if chat_doc else None
    if not cur_title or str(cur_title).strip().lower() in ("new chat", "untitled"):
        try:
            title_prompt = (
                "Provide a concise 3-6 word title summarizing the conversation so far. "
                "Return only the title text without extra punctuation.\n\nConversation:\n"
                + (history if history else payload.content)
            )
            title_resp = get_chat_model(temperature=0.0).invoke(title_prompt)
            title_text = title_resp.content.strip() if hasattr(title_resp, "content") else str(title_resp).strip()
            if title_text:
                # sanitize and shorten the title: collapse whitespace, limit words and chars
                cleaned = re.sub(r"\s+", " ", title_text).strip()
                # limit to first 6 words
                words = cleaned.split(" ")
                cleaned = " ".join(words[:6])
                # enforce max chars (40)
                if len(cleaned) > 40:
                    cleaned = cleaned[:40].rstrip()
                # strip trailing punctuation
                cleaned = cleaned.rstrip(' .,:;!-')
                if cleaned:
                    await db.chats.update_one({"_id": ObjectId(chat_id)}, {"$set": {"title": cleaned}})
                    updated_title = cleaned
        except Exception:
            # non-fatal: ignore title generation failures
            updated_title = None

    result = {"answer": answer, "sources": assistant_msg["sources"]}
    if updated_title:
        result["title"] = updated_title
    return result


@router.post("/messages/{message_id}/feedback")
async def message_feedback(message_id: str, payload: FeedbackPayload):
    """Attach feedback ('like' or 'dislike') to a message by its id."""
    db = get_db()
    # ensure message exists
    try:
        oid = ObjectId(message_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid message id")

    msg = await db.messages.find_one({"_id": oid})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    update = {"$set": {"feedback": payload.feedback, "feedback_at": datetime.datetime.utcnow()}}
    await db.messages.update_one({"_id": oid}, update)

    updated = await db.messages.find_one({"_id": oid})
    return oid_to_str(updated)
