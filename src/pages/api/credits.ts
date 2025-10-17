import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@lovable/database";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: "user_id é obrigatório" });
      }

      const result = await query(
        "SELECT credits FROM users WHERE id = $1",
        [user_id]
      );

      const credits = result[0]?.credits ?? 0;
      return res.status(200).json({ credits });
    }

    if (req.method === "POST") {
      const { user_id, credits } = req.body;

      if (!user_id || credits === undefined) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes" });
      }

      await query(
        "UPDATE users SET credits = $1 WHERE id = $2",
        [credits, user_id]
      );

      return res.status(200).json({ success: true, credits });
    }

    // Método não permitido
    return res.status(405).json({ error: "Método não permitido" });
  } catch (error) {
    console.error("Erro na API /api/credits:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

