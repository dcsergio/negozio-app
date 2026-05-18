const { execSync } = require("node:child_process");

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function sanitizeBranchName(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._/-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

try {
  const currentBranch = run("git rev-parse --abbrev-ref HEAD");
  const rawName = process.argv.slice(2).join(" ");

  if (!rawName) {
    console.error("Uso: npm run start-branch -- fix/nome-branch");
    process.exit(1);
  }

  const branchName = sanitizeBranchName(rawName);

  if (!branchName) {
    console.error("Nome branch non valido.");
    process.exit(1);
  }

  if (currentBranch !== "main" && currentBranch !== "master") {
    console.log(
      `Sei su '${currentBranch}'. Passa a main/master prima di creare il branch di lavoro.`
    );
    process.exit(1);
  }

  const targetExists = run(
    `git branch --list ${JSON.stringify(branchName)}`
  ).length > 0;

  if (targetExists) {
    run(`git switch ${JSON.stringify(branchName)}`);
    console.log(`Branch esistente attivato: ${branchName}`);
  } else {
    run(`git switch -c ${JSON.stringify(branchName)}`);
    console.log(`Nuovo branch creato e attivato: ${branchName}`);
  }

  console.log("Ora puoi iniziare le modifiche in sicurezza.");
} catch (error) {
  console.error(error.message || "Errore durante la gestione del branch.");
  process.exit(1);
}
