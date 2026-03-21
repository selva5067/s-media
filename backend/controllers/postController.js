import Post from "../models/Post.js";

export const createPost = async (req, res) => {
  const post = new Post({ userId: req.user.id, content: req.body.content });
  await post.save();
  res.json(post);
};

export const getPosts = async (req, res) => {
  const posts = await Post.find().populate("userId", "username");
  res.json(posts);
};

export const toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post.likes.includes(req.user.id)) {
    post.likes.push(req.user.id);
  } else {
    post.likes = post.likes.filter(id => id.toString() !== req.user.id);
  }
  await post.save();
  res.json(post);
};