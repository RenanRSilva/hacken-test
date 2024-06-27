import React, { useState } from "react";
import { Image, Row, Select, Table, Typography } from "antd";
import type { TableProps } from "antd";
import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import axios, { AxiosError } from "axios";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "react-query";
import { toast } from "react-toastify";
import { Controller, useForm } from "react-hook-form";

const codeMirrorValue = `
import React, { useState } from "react";
import { Image, Row, Select, Table, Typography } from "antd";
import type { TableProps } from "antd";
import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import axios, { AxiosError } from "axios";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "react-query";
import { toast } from "react-toastify";
import { Controller, useForm } from "react-hook-form";

interface MarketCoins {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: number | null;
  last_updated: string;
}

interface MarketCoinsFilterInputs {
  currency: string;
  marketCap: string;
}

interface MarketCoinsParams {
  vs_currency: string;
  order: string;
}

enum CoinsHttpEndpoint {
  COINS_MARKET = "/coins/markets",
}

enum MarketCoinsQueries {
  GET_MARKET_COINS_QUERIES = "GET_MARKET_COINS_QUERIES",
}

const axiosInstance = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});

function asyncGetCoins(
  params: MarketCoinsParams,
  page: number,
  pageSize: number
): Promise<MarketCoins[]> {
  return axiosInstance
    .get<MarketCoins[]>(CoinsHttpEndpoint.COINS_MARKET, {
      params: {
        ...params,
        page: page,
        per_page: pageSize,
      },
    })
    .then((res) => res.data)
    .catch((error) => Promise.reject(error));
}

function handleQueryError(error: unknown): string {
  if (error instanceof AxiosError && error.response) {
    const { response } = error;

    return response?.data.message || "Unknown error";
  } else if (error instanceof AxiosError && error.request) {
    return "No response from server";
  }
  return (error as Error).message;
}

function errorNotificationToast(message: string) {
  return toast.error(message, {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
}

const CoinMarketPage: React.FC = () => {
  const { control, watch } = useForm<MarketCoinsFilterInputs>({
    defaultValues: {
      currency: "usd",
      marketCap: "market_cap_desc",
    },
  });

  const [currency, marketCap] = watch(["currency", "marketCap"]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const columns: TableProps<MarketCoins>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, data) => (
        <Row style={{ gap: "16px" }}>
          <Image width={32} src={data.image} />
          {name}
        </Row>
      ),
    },
    {
      title: "Current Price",
      dataIndex: "current_price",
      key: "current_price",
      render: (current_price) => (
        <Row style={{ gap: "16px" }}>{\`\${current_price} \${currency}\`}</Row>
      ),
    },
    {
      title: "Circulating Supply",
      dataIndex: "circulating_supply",
      key: "circulating_supply",
    },
  ];

  function useGetMarketCoinsQuery() {
    const queryClient = useQueryClient();

    const marketCoinsQueryData = queryClient.getQueryData<MarketCoins[]>([
      MarketCoinsQueries.GET_MARKET_COINS_QUERIES,
      currency,
      marketCap,
      currentPage,
    ]);

    return useQuery(
      [
        MarketCoinsQueries.GET_MARKET_COINS_QUERIES,
        currency,
        marketCap,
        currentPage,
        pageSize,
      ],
      () =>
        asyncGetCoins(
          {
            vs_currency: currency,
            order: marketCap,
          },
          currentPage,
          pageSize
        ),
      {
        initialData: marketCoinsQueryData || [],
        onError: (error) => {
          errorNotificationToast(handleQueryError(error));
        },
        onSuccess: (data) => {
          queryClient.setQueryData(
            [
              MarketCoinsQueries.GET_MARKET_COINS_QUERIES,
              currency,
              marketCap,
              currentPage,
            ],
            data
          );
        },
      }
    );
  }

  const {
    data: marketCoinsData,
    isLoading,
    isFetching,
  } = useGetMarketCoinsQuery();

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  return (
    <div style={{ gap: "24px", display: "flex", flexDirection: "column" }}>
      <Typography style={{ fontSize: "24px" }}>Coins & Markets</Typography>
      <Row style={{ gap: "24px" }}>
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select
              {...field}
              style={{ width: 200 }}
              placeholder="Select currency"
              options={[
                { value: "usd", label: "USD" },
                { value: "eur", label: "EUR" },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="marketCap"
          render={({ field }) => (
            <Select
              {...field}
              style={{ width: 200 }}
              placeholder="Select market cap"
              options={[
                { value: "market_cap_desc", label: "Market cap descending" },
                { value: "market_cap_asc", label: "Market cap ascending" },
              ]}
            />
          )}
        />
      </Row>
      <Table
        columns={columns}
        loading={isLoading || isFetching}
        dataSource={marketCoinsData}
        pagination={{
          total: 1000,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) =>
            \`Showing \${range[0]}-\${range[1]} of \${total} items\`,
          onChange: handlePageChange,
        }}
      />
      <Typography style={{ fontSize: "24px" }}>App source code</Typography>
      <ReactCodeMirror
        value={codeMirrorValue}
        extensions={[javascript({ jsx: true, typescript: true })]}
      />
    </div>
  );
};

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        keepPreviousData: true,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <CoinMarketPage />
    </QueryClientProvider>
  );
};

export default App;
`;

interface MarketCoins {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: number | null;
  last_updated: string;
}

interface MarketCoinsFilterInputs {
  currency: string;
  marketCap: string;
}

interface MarketCoinsParams {
  vs_currency: string;
  order: string;
}

enum CoinsHttpEndpoint {
  COINS_MARKET = "/coins/markets",
}

enum MarketCoinsQueries {
  GET_MARKET_COINS_QUERIES = "GET_MARKET_COINS_QUERIES",
}

const axiosInstance = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});

function asyncGetCoins(
  params: MarketCoinsParams,
  page: number,
  pageSize: number
): Promise<MarketCoins[]> {
  return axiosInstance
    .get<MarketCoins[]>(CoinsHttpEndpoint.COINS_MARKET, {
      params: {
        ...params,
        page: page,
        per_page: pageSize,
      },
    })
    .then((res) => res.data)
    .catch((error) => Promise.reject(error));
}

function handleQueryError(error: unknown): string {
  if (error instanceof AxiosError && error.response) {
    const { response } = error;

    return response?.data.message || "Unknown error";
  } else if (error instanceof AxiosError && error.request) {
    return "No response from server";
  }
  return (error as Error).message;
}

function errorNotificationToast(message: string) {
  return toast.error(message, {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
}

const CoinMarketPage: React.FC = () => {
  const { control, watch } = useForm<MarketCoinsFilterInputs>({
    defaultValues: {
      currency: "usd",
      marketCap: "market_cap_desc",
    },
  });

  const [currency, marketCap] = watch(["currency", "marketCap"]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const columns: TableProps<MarketCoins>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, data) => (
        <Row style={{ gap: "16px" }}>
          <Image width={32} src={data.image} />
          {name}
        </Row>
      ),
    },
    {
      title: "Current Price",
      dataIndex: "current_price",
      key: "current_price",
      render: (current_price) => (
        <Row style={{ gap: "16px" }}>{`${current_price} ${currency}`}</Row>
      ),
    },
    {
      title: "Circulating Supply",
      dataIndex: "circulating_supply",
      key: "circulating_supply",
    },
  ];

  function useGetMarketCoinsQuery() {
    const queryClient = useQueryClient();

    const marketCoinsQueryData = queryClient.getQueryData<MarketCoins[]>([
      MarketCoinsQueries.GET_MARKET_COINS_QUERIES,
      currency,
      marketCap,
      currentPage,
    ]);

    return useQuery(
      [
        MarketCoinsQueries.GET_MARKET_COINS_QUERIES,
        currency,
        marketCap,
        currentPage,
        pageSize,
      ],
      () =>
        asyncGetCoins(
          {
            vs_currency: currency,
            order: marketCap,
          },
          currentPage,
          pageSize
        ),
      {
        initialData: marketCoinsQueryData || [],
        onError: (error) => {
          errorNotificationToast(handleQueryError(error));
        },
        onSuccess: (data) => {
          queryClient.setQueryData(
            [
              MarketCoinsQueries.GET_MARKET_COINS_QUERIES,
              currency,
              marketCap,
              currentPage,
            ],
            data
          );
        },
      }
    );
  }

  const {
    data: marketCoinsData,
    isLoading,
    isFetching,
  } = useGetMarketCoinsQuery();

  const handlePageChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  return (
    <div style={{ gap: "24px", display: "flex", flexDirection: "column" }}>
      <Typography style={{ fontSize: "24px" }}>Coins & Markets</Typography>
      <Row style={{ gap: "24px" }}>
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Select
              {...field}
              style={{ width: 200 }}
              placeholder="Select currency"
              options={[
                { value: "usd", label: "USD" },
                { value: "eur", label: "EUR" },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="marketCap"
          render={({ field }) => (
            <Select
              {...field}
              style={{ width: 200 }}
              placeholder="Select market cap"
              options={[
                { value: "market_cap_desc", label: "Market cap descending" },
                { value: "market_cap_asc", label: "Market cap ascending" },
              ]}
            />
          )}
        />
      </Row>
      <Table
        columns={columns}
        loading={isLoading || isFetching}
        dataSource={marketCoinsData}
        pagination={{
          total: 1000,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showTotal: (total, range) =>
            `Showing ${range[0]}-${range[1]} of ${total} items`,
          onChange: handlePageChange,
        }}
      />
      <Typography style={{ fontSize: "24px" }}>App source code</Typography>
      <ReactCodeMirror
        value={codeMirrorValue}
        extensions={[javascript({ jsx: true, typescript: true })]}
      />
    </div>
  );
};

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        keepPreviousData: true,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <CoinMarketPage />
    </QueryClientProvider>
  );
};

export default App;
