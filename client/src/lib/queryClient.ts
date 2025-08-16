import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit
): Promise<Response> {
  // Get token from localStorage if it exists
  const token = localStorage.getItem("auth_token");
  
  // Create a headers object
  let headersObj: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  
  // Add Authorization header if token exists
  if (token) {
    headersObj["Authorization"] = `Bearer ${token}`;
  }
  
  // If data is FormData, don't set Content-Type or stringify the body
  // The browser will set the proper Content-Type with boundary for multipart/form-data
  let body: any = undefined;
  
  if (data) {
    if (data instanceof FormData) {
      body = data;
    } else {
      headersObj["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(url, {
    method,
    headers: headersObj,
    body,
    credentials: "include",
    ...options,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
