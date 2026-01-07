import React, { useEffect, useState } from "react";
import "./App.css";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [participants, setParticipants] = useState(0);
  const [joinId, setJoinId] = useState("");
  const [mode, setMode] = useState<"none" | "create" | "join">("none");

  /* ---------------- CREATE SESSION ---------------- */
  const startSession = async () => {
    if (sessionId) return;

    const id = crypto.randomUUID();
    setSessionId(id);
    setMode("none");

    await setDoc(doc(db, "sessions", id), {
      participants: 1,
      createdAt: Date.now(),
    });
  };

  /* ---------------- JOIN SESSION ---------------- */
  const joinSession = async () => {
    if (!joinId.trim() || sessionId) return;

    setSessionId(joinId);
    setMode("none");

    await updateDoc(doc(db, "sessions", joinId), {
      participants: increment(1),
    });
  };

  /* ---------------- ADD COMMENT ---------------- */
  const addComment = async () => {
    if (!comment.trim() || !sessionId) return;

    await addDoc(
      collection(db, "sessions", sessionId, "comments"),
      {
        text: comment,
        createdAt: Date.now(),
      }
    );

    setComment("");
  };

  /* ---------------- PARTICIPANTS LISTENER ---------------- */
  useEffect(() => {
    if (!sessionId) return;

    const ref = doc(db, "sessions", sessionId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setParticipants(snap.data().participants || 1);
      }
    });

    return () => unsub();
  }, [sessionId]);

  /* ---------------- COMMENTS LISTENER ---------------- */
  useEffect(() => {
    if (!sessionId) return;

    const q = query(
      collection(db, "sessions", sessionId, "comments"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: string[] = [];
      snap.forEach((d) => list.push(d.data().text));
      setComments(list);
    });

    return () => unsub();
  }, [sessionId]);

  return (
    <div className="container">
      <h2>CollabBoard</h2>
      <p className="subtitle">Collaborative feedback for Adobe Express</p>

      {/* -------- INITIAL UI -------- */}
      {mode === "none" && !sessionId && (
        <>
          <button onClick={() => setMode("create")}>
            Start Collaboration
          </button>

          <p className="or-text">OR</p>

          <button onClick={() => setMode("join")}>
            Join Session
          </button>
        </>
      )}

      {/* -------- CREATE -------- */}
      {mode === "create" && !sessionId && (
        <button onClick={startSession}>
          Create Session
        </button>
      )}

      {/* -------- JOIN -------- */}
      {mode === "join" && !sessionId && (
        <>
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Paste Session ID"
          />
          <button onClick={joinSession}>
            Join Session
          </button>
        </>
      )}

      {/* -------- ACTIVE SESSION -------- */}
      {sessionId && (
        <>
          <div className="session-box">
            <p className="status">Collaboration Active 🟢</p>
            <p className="session">
              Session ID: <b>{sessionId}</b>
            </p>
            <p>👥 Participants: {participants}</p>
          </div>

          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
          />

          <button onClick={addComment}>
            Add Comment
          </button>

          <div className="comments">
            <h4>Feedback</h4>

            {comments.length === 0 && (
              <p className="muted">No comments yet</p>
            )}

            {comments.map((c, i) => (
              <div key={i} className="comment">
                💬 {c}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

