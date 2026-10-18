import { Pagination } from 'react-bootstrap'

// Paginazione compatta: prima, precedente, al massimo 5 numeri, successiva, ultima. page parte da 0
export default function AppPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const start = Math.max(0, Math.min(page - 2, totalPages - 5))
  const end = Math.min(totalPages, start + 5)
  const pages = Array.from({ length: end - start }, (_, i) => start + i)

  return (
    <Pagination className="justify-content-center mt-4 flex-wrap">
      <Pagination.First disabled={page === 0} onClick={() => onChange(0)} />
      <Pagination.Prev disabled={page === 0} onClick={() => onChange(page - 1)} />
      {pages.map((p) => (
        <Pagination.Item key={p} active={p === page} onClick={() => onChange(p)}>
          {p + 1}
        </Pagination.Item>
      ))}
      <Pagination.Next disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} />
      <Pagination.Last disabled={page >= totalPages - 1} onClick={() => onChange(totalPages - 1)} />
    </Pagination>
  )
}
