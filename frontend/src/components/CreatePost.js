import { useState } from "react";
import API from "../api/axios";

export default function CreatePost({ setPosts }) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await API.post("/posts", { content });
    setPosts(prev => [data, ...prev]);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)} />
      <button type="submit">Post</button>
    </form>
  );
}