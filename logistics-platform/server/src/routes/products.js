import { Router } from "express";
import { z } from "zod";
import { requireRegisteredUser, verifySupabaseToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { Product } from "../models/Product.js";

const router = Router();

const productSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().min(0),
  category: z.string().min(2),
  imageUrl: z.string().url().optional()
});

router.get("/", async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", verifySupabaseToken, requireRegisteredUser, validateBody(productSchema), async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      ownerId: req.user.id || req.user._id
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
