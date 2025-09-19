import Card from "../../models/Card";

export async function addCard(req, res, next) {
  try {
    const { name, description, image, tags, content } = req.body;
    const userId = req.session.userId;
    console.log("=== DEBUG INFO ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("req.files:", req.files);
    console.log("Content-Type:", req.get("Content-Type"));
    console.log("==================");
    const card = new Card({
      name,
      description,
      image: req.file ? req.file.filename : image,
      tags,
      owner: userId,
      content,
    });

    await card.save();
  } catch (error) {
    next(error);
  }
}

export async function deleteCard(req, res, next) {
  try {
    const userId = req.session.userId;
    const cardId = req.params.cardId;
    await Card.deleteOne({ _id: cardId, owner: userId });
    res.redirect("/");
  } catch (error) {
    next(error);
  }
}
