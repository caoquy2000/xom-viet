import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import type { FeedQuery } from "@xom/api-client";
export function useSearch(setQuery: Dispatch<SetStateAction<FeedQuery>>) {
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(
      () => setQuery((previous) => ({ ...previous, query: search })),
      280,
    );
    return () => clearTimeout(timer);
  }, [search, setQuery]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool(tool: object, options: object): void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "start_xom_search",
            description: "Điền từ khóa và bắt đầu tìm kiếm trong bảng tin Xóm.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", maxLength: 100 } },
              required: ["query"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                !("query" in input) ||
                typeof input.query !== "string" ||
                input.query.length > 100 ||
                Object.keys(input).some((key) => key !== "query")
              )
                throw new Error("query phải là chuỗi tối đa 100 ký tự.");
              const value = input.query;
              flushSync(() => {
                setSearch(value);
                setQuery((previous) => ({ ...previous, query: value }));
              });
              return { query: value, status: "search_requested" };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [setQuery]);
  return { search, setSearch };
}
