import { queryOptions } from "@tanstack/react-query";
import { getProduct, getStoreConfig, listProducts } from "./store.functions";

export const productsQuery = () =>
  queryOptions({ queryKey: ["products"], queryFn: () => listProducts(), staleTime: 30_000 });
export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }), staleTime: 10_000 });
export const configQuery = () =>
  queryOptions({ queryKey: ["config"], queryFn: () => getStoreConfig(), staleTime: 60_000 });
