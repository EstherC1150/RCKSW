import React, { ReactNode } from "react";
import ClientLayout from "./ClientLayout";

type Props = {
  children: ReactNode;
};

const layout = ({ children }: Props) => {
  return <ClientLayout>{children}</ClientLayout>;
};

export default layout;
