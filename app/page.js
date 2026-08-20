"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://website-back-end.vercel.app/api/articles";

const emptyForm = {
  title: "",
  Type: "",
  image: "",
  image2: "",
  image3: "",
  body: "",
};

const requestTimeout = 10000;

const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeout);

  return fetch(url, { ...options, signal: controller.signal })
    .catch((err) => {
      if (err.name === "AbortError") {
        const error = new Error("Request timeout");
        error.name = "AbortError";
        throw error;
      }
      throw err;
    })
    .finally(() => {
      clearTimeout(timeout);
    });
};

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const getErrorMessage = async (response) => {
    try {
      const data = await response.json();
      return data?.message || `حدث خطأ في الطلب (${response.status})`;
    } catch {
      return `حدث خطأ في الطلب (${response.status})`;
    }
  };

  const loadArticles = async () => {
    setIsLoadingArticles(true);
    setError("");

    try {
      const response = await fetchWithTimeout(API_URL);
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.articles)
        ? data.articles
        : [];

      setArticles(list);
    } catch (err) {
      console.error("Load articles error:", err);
      setArticles([]);
      
      if (err.name === "AbortError") {
        setError("استغرق تحميل الأعمال وقتًا طويلًا. تأكد من تشغيل الـ API.");
      } else if (err instanceof TypeError) {
        setError("تعذر الاتصال بـ API. تحقق من الإنترنت والـ API URL.");
      } else {
        setError(err.message || "تعذر تحميل الأعمال. حاول مجددًا.");
      }
    } finally {
      setIsLoadingArticles(false);
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
    setError("");

    try {
      const response = await fetchWithTimeout(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadArticles();
    } catch (err) {
      console.error("Submit error:", err);
      if (err.name === "AbortError") {
        setError("انتهت مهلة الطلب. حاول مجددًا.");
      } else if (err instanceof TypeError) {
        setError("تعذر الاتصال بـ API. تحقق من الإنترنت.");
      } else {
        setError(err.message || "تعذر حفظ العمل. حاول مجددًا.");
      }
    } finally {
      setLoading(false);
    }
  };

  const editArticle = (article) => {
    setForm({
      title: article.title,
      Type: article.Type,
      image: article.image,
      image2: article.image2,
      image3: article.image3,
      video: article.video,
      body: article.body,
    });
    setEditingId(article._id);
  };

  const deleteArticle = async (id) => {
    if (!confirm("هل تريد حذف هذا العمل؟")) return;

    setDeletingId(id);
    setError("");

    try {
      const response = await fetchWithTimeout(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      await loadArticles();
    } catch (err) {
      console.error("Delete error:", err);
      if (err.name === "AbortError") {
        setError("انتهت مهلة الطلب. حاول مجددًا.");
      } else if (err instanceof TypeError) {
        setError("تعذر الاتصال بـ API. تحقق من الإنترنت.");
      } else {
        setError(err.message || "تعذر حذف العمل. حاول مجددًا.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className={styles.dashboard}>
      <h1>Works Dashboard</h1>

      {error && <p className={styles.error}>{error}</p>}

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

        <input
          name="image2"
          placeholder="رابط صورة العمل 2"
          value={form.image2}
          onChange={handleChange}
          
        />

        <input
          name="image3"
          placeholder="رابط صورة العمل 3"
          value={form.image3}
          onChange={handleChange}
          
        />

        <input
          name="video"
          placeholder="رابط الفيديو"
          value={form.video}
          onChange={handleChange}
          
        />

        <textarea
          name="body"
          placeholder="وصف العمل"
          value={form.body}
          onChange={handleChange}
          required
        />

          <button disabled={loading || deletingId !== null}>
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
        {isLoadingArticles && <p>جاري تحميل الأعمال...</p>}
        {!isLoadingArticles && !error && articles.length === 0 && (
          <p>لا توجد أعمال بعد.</p>
        )}
        {articles.map((article) => (
          <article className={styles.card} key={article._id}>
            <img src={article.image} alt={article.title} />
            <div>
              <small>{article.Type}</small>
              <h2>{article.title}</h2>
              <p>{article.body}</p>
              <button
                disabled={loading || deletingId !== null}
                onClick={() => editArticle(article)}
              >
                تعديل
              </button>
              <button
                className={styles.delete}
                disabled={loading || deletingId !== null}
                onClick={() => deleteArticle(article._id)}
              >
                {deletingId === article._id ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}