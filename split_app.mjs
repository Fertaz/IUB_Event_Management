import { Project } from "ts-morph";
import fs from "fs";
import path from "path";

const project = new Project();

project.addSourceFileAtPath("src/app/App.tsx");
const sourceFile = project.getSourceFileOrThrow("src/app/App.tsx");
const functions = sourceFile.getFunctions();

const outDirs = [
  "src/app/pages",
  "src/app/features/auth",
  "src/app/features/events",
  "src/app/components/layout",
  "src/app/contexts"
];

outDirs.forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// A manual mapping
const fileMapping = {
  "loadStore": null,
  "loadAuth": null,
  "Providers": "src/app/contexts/Providers.tsx",
  "AppShell": "src/app/components/layout/AppShell.tsx",
  "LoginPage": "src/app/features/auth/LoginPage.tsx",
  "RegisterPage": "src/app/features/auth/RegisterPage.tsx",
  "ForgotPasswordPage": "src/app/features/auth/ForgotPasswordPage.tsx",
  "DashboardPage": "src/app/pages/DashboardPage.tsx",
  "EventFeedPage": "src/app/features/events/EventFeedPage.tsx",
  "EventDetailPage": "src/app/features/events/EventDetailPage.tsx",
  "EventManagePage": "src/app/features/events/EventManagePage.tsx",
  "EventFormPage": "src/app/features/events/EventFormPage.tsx",
  "LandingPage": "src/app/pages/LandingPage.tsx"
};

functions.forEach(func => {
  const name = func.getName();
  if (fileMapping[name]) {
    const filePath = fileMapping[name];
    console.log(`Extracting ${name} to ${filePath}`);
    const newFile = project.createSourceFile(filePath, func.getText(), { overwrite: true });
    // Add default export
    newFile.addExportAssignment({
        isExportEquals: false,
        expression: name
    });
    // Add imports placeholder
    newFile.insertText(0, `import React from 'react';\n// TODO: Fix imports\n`);
    newFile.saveSync();
  }
});
console.log("Done extracting components.");
