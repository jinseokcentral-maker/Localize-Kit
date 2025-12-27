import { ProjectTranslationsPage } from "~/pages/dashboard/ProjectTranslationsPage";
import type { Route } from "./+types/_app.dashboard.projects.$projectId._index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Project Translations - LocalizeKit" },
    {
      name: "description",
      content: "Manage translations across languages for this project.",
    },
  ];
}

export default function ProjectTranslationsRoute() {
  return <ProjectTranslationsPage />;
}
