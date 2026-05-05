import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "@/components/Pagination";

describe("Pagination", () => {
  it("should not render when totalPages is 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render page numbers", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should highlight current page", () => {
    render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />);

    const currentPage = screen.getByText("3");
    expect(currentPage).toHaveAttribute("aria-current", "page");
  });

  it("should call onPageChange when clicking a page", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText("2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should disable previous button on first page", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);

    const prevButton = screen.getByLabelText("Önceki sayfa");
    expect(prevButton).toBeDisabled();
  });

  it("should disable next button on last page", () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);

    const nextButton = screen.getByLabelText("Sonraki sayfa");
    expect(nextButton).toBeDisabled();
  });

  it("should show ellipsis for many pages", () => {
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);

    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBeGreaterThan(0);
  });
});
