"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://website-back-end.vercel.app/api/articles";

const emptyForm = {
  title: "",
  Type: "",
  image: "",
  body: "",
};

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadArticles = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        console.error("Failed to fetch articles", response.status);
        setArticles([]);
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.articles)
        ? data.articles
        : [];

      setArticles(list);
    } catch (err) {
      console.error(err);
      setArticles([]);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm(emptyForm);
    setEditingId(null);
    await loadArticles();
    setLoading(false);
  };

  const editArticle = (article) => {
    setForm({
      title: article.title,
      Type: article.Type,
      image: article.image,
      body: article.body,
    });
    setEditingId(article._id);
  };

  const deleteArticle = async (id) => {
    if (!confirm("هل تريد حذف هذا العمل؟")) return;

    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    loadArticles();
  };

  return (
    <main className={styles.dashboard}>
      <h1>Works Dashboard</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="عنوان العمل"
          value={form.title}
          onChange={handleChange}
          required
        />

        <input
          name="Type"
          placeholder="نوع العمل"
          value={form.Type}
          onChange={handleChange}
          required
        />

        <input
          name="image"
          placeholder="رابط صورة العمل"
          value={form.image}
          onChange={handleChange}
          required
        />

        <textarea
          name="body"
          placeholder="وصف العمل"
          value={form.body}
          onChange={handleChange}
          required
        />

        <button disabled={loading}>
          {editingId ? "حفظ التعديل" : "إضافة العمل"}
        </button>

        {editingId && (
          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
            }}
          >
            إلغاء
          </button>
        )}
      </form>

      <section className={styles.grid}>
        {articles.map((article) => (
          <article className={styles.card} key={article._id}>
            <img src={article.image} alt={article.title} />
            <div>
              <small>{article.Type}</small>
              <h2>{article.title}</h2>
              <p>{article.body}</p>
              <button onClick={() => editArticle(article)}>تعديل</button>
              <button
                className={styles.delete}
                onClick={() => deleteArticle(article._id)}
              >
                حذف
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}