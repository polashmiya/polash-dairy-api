import Post from "../models/Post.js";
import { validationResult } from "express-validator";

const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { title, content } = req.body;
    const post = new Post({
      title,
      content,
      imageUrl: req.imageUrl ? req.imageUrl : null,
      category: req.category,
    });
    post.author = req.user._id;
    await post.save();
    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (typeof search === "string" && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ title: regex }, { content: regex }, { category: regex }];
    }

    const posts = await Post.find(filter)
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (
      req.user.role !== "admin" &&
      String(post.author) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await post.remove();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comment = {
      user: req.user._id,
      text: req.body.text,
    };
    post.comments.push(comment);
    await post.save();
    res.status(201).json({ message: "Comment added successfully", comment });
  } catch (error) {
    next(error);
  }
};

export default { createPost, getPosts, deletePost, addComment };
