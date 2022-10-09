import type { NextPage } from "next";

import dynamic from "next/dynamic";
import Head from "next/head";

const Flow = dynamic(() => import("../containers/Flow").then((m) => m.Flow), {
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <div className="grid grid-cols-3">
      <Head>
        <title>Iris-bound Tokens</title>
      </Head>
      <div className="col-span-2 p-8 text-center">
        <h1 className="mb-10 text-center text-6xl">CapybaraDAO</h1>

        <a
          href="https://snapshot.org/#/"
          className="mb-8 block text-center text-xl underline"
        >
          Have a look at our important Snapshot votes!!1
        </a>

        <h2 className="mb-4 text-2xl">Ur membership</h2>

        <Flow />
      </div>
      <img
        src="https://www.rainforest-alliance.org/wp-content/uploads/2021/06/capybara-square-1-400x400.jpg.webp"
        className="h-full w-full object-cover"
        alt=""
      />
    </div>
  );
};

export default Home;
