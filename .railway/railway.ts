import { defineRailway, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "lrx";

export default defineRailway(() => {
  const lrx = service("lrx", {
    build: "npm run build -w web && cp -r apps/web/public apps/web/.next/standalone/apps/web/public && mkdir -p apps/web/.next/standalone/apps/web/.next && cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static",
    start: "node apps/web/.next/standalone/apps/web/server.js",
    // builder from CaC: "nixpacks"
  });
  return project("wholesome-adaptation", {
    resources: [lrx],
  });
});
