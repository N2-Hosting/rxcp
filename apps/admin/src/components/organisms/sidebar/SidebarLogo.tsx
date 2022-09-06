import { PrimaryLogo } from "@components/atoms/logo/PrimaryLogo";
import type { Component } from "solid-js";

export const SidebarLogo: Component = () => {
  return (
    <div class="ml-4 pb-6 text-center flex items-center space-x-4 font-medium">
      <PrimaryLogo />
      <span class="text-2xl font-bold">RXCP</span>
    </div>
  );
};
