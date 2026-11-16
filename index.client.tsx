import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { OfficeScreen } from "./client/office-screen";

function OfficeItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return (
    <SidebarRow
      icon="Building2"
      label="Office"
      active={currentScreen?.screenId === "office"}
      onPress={() => openScreen({ screenId: "office" })}
    />
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "office", title: "Agent office", Component: OfficeScreen });
  client.addSidebarHeaderItem({ id: "office", title: "Office", Component: OfficeItem });
  return () => {};
}
