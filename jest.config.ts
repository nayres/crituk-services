import { getJestProjectsAsync } from "@nx/jest";

export default async () => ({
  projects: await getJestProjectsAsync(),
  coverageReporters: ["html", "text", "lcov"],
  coverageDirectory: "coverage",
});
