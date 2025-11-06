import Post from "../models/Post.js";
import mongoose from "mongoose";
import { validationResult } from "express-validator";

const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { title, content,category } = req.body;
    const post = new Post({
      title,
      content,
      imageUrl: req.imageUrl ? req.imageUrl : null,
      category,
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
      .populate({ path: "comments.user", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    // Add authorName inside each comment while keeping user reference
    const postsWithAuthorName = posts.map((post) => ({
      ...post,
      comments: (post.comments || []).map((c) => ({
        ...c,
        authorName: c?.user && typeof c.user === "object" ? c.user.name : undefined,
      })),
    }));

    res.status(200).json({ posts: postsWithAuthorName });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "No posts found of this id" });
    }
    const postDoc = await Post.findById(id)
      .populate("author", "name email")
      .populate({ path: "comments.user", select: "name" })
      .lean();
    if (!postDoc) {
      return res.status(404).json({ message: "No posts found of this id" });
    }
    const post = {
      ...postDoc,
      comments: (postDoc.comments || []).map((c) => ({
        ...c,
        authorName: c?.user && typeof c.user === "object" ? c.user.name : undefined,
      })),
    };
    return res.status(200).json({ post });
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
    const text = req.body?.comment ?? req.body?.text;
    const comment = {
      user: req.user._id,
      text,
    };
    post.comments.push(comment);
    await post.save();
    res.status(201).json({ message: "Comment added successfully", comment });
  } catch (error) {
    next(error);
  }
};


const updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is the author or an admin
    if (String(post.author) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update post fields
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    if (req.imageUrl) {
      post.imageUrl = req.imageUrl;
    }

    await post.save();
    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    // Check if the user is the comment author or an admin
    if (String(comment.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    comment.remove();
    await post.save();
    
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};
export default { createPost, getPosts, getPostById, deletePost, addComment, updatePost, deleteComment };
