import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function PublicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    apiClient.get(`/public/pages/${slug}`)
      .then((res) => setPage(res.data.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  if (notFound) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl">&#128533;</span>
        <p className="text-gray-500 dark:text-gray-400 mt-3">Page not found</p>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div>
      {page.cover_image && (
        <img src={page.cover_image} alt="" className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-6" />
      )}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{page.title}</h1>
      <div className="prose prose-lg dark:prose-invert max-w-none prose-a:text-primary-600 dark:prose-a:text-primary-400"
        dangerouslySetInnerHTML={{ __html: page.body }} />
    </div>
  );
}
