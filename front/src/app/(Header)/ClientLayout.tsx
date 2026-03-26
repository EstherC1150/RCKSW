"use client";

import React from "react";
import useUserStore from "../stores/UserStore";
import Header from "../_components/common/Header";
import Sidebar from "../_components/common/Sidebar";

type Props = {
  children: React.ReactNode;
};

const ClientLayout = ({ children }: Props) => {
  const { user } = useUserStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {user?.role === "admin" && <Sidebar />}
        <main className="flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  );
};

export default ClientLayout;
