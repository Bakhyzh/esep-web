interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  onPage: (page: number) => void
}

export function Pagination({ page, totalPages, totalElements, onPage }: PaginationProps) {
  if (totalElements === 0) {
    return null
  }
  return (
    <div className="pagination">
      <span className="muted">{totalElements} operations · page {page + 1} of {Math.max(totalPages, 1)}</span>
      <div className="row">
        <button type="button" className="secondary" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
        <button type="button" className="secondary" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  )
}
