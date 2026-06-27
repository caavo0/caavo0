export default async function handler(req, res) {
  res.status(200).json({ reply: "Kral, şu an sistem güncelleniyor, birazdan geleceğim!" });
}