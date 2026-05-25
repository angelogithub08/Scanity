const { execSync } = require("child_process");

module.exports = function (plop) {
  plop.setHelper("newLines", function (fields) {
    return fields
      .split(";")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((f) => `  ${f};`)
      .join("\n\n");
  });

  // Helper para capitalizar cada palavra (inicial maiúscula)
  plop.setHelper("capitalizeCase", function (text) {
    if (!text) return "";

    return text
      .split(/[ _-]/) // Separa por espaço, underline ou hífen
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  });

  // Helper para comparar valores (usado nos templates para comparações condicionais)
  plop.setHelper("eq", function (a, b) {
    return a === b;
  });

  // Helper para gerar lista de campos para o defaultSelectFields
  plop.setHelper("defaultSelectFields", function (fields) {
    let result = '    "id",\n    "created_at",\n    "updated_at"';

    if (!fields || fields.trim() === "") {
      return result;
    }

    // Processa os campos definidos e os converte para snake_case (formato de coluna do BD)
    const fieldList = fields
      .split(";")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((field) => {
        // Formato esperado: name: type
        const parts = field.split(":");
        const name = parts[0].trim();

        // Converte para snake_case para uso no banco de dados
        return `    \"${plop.getHelper("snakeCase")(name)}\"`;
      })
      .join(",\n");

    // Retorna os campos padrão junto com os campos personalizados
    return result + ",\n" + fieldList;
  });

  // Helper para gerar propriedades simples da entidade (apenas propriedade e tipo)
  plop.setHelper("splitEntityFields", function (fields) {
    if (!fields) return "";

    return fields
      .split(";")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((field) => {
        // Formato esperado: name: type
        const parts = field.split(":");
        const name = parts[0].trim();
        let type = parts.length > 1 ? parts[1].trim() : "string";

        // Verificar se o campo é opcional
        const isOptional = field.includes("[optional]");

        // Limpar o tipo de qualquer modificador
        type = type.split(" ")[0];

        // Retornar apenas nome da propriedade e tipo
        return `  ${name}${isOptional ? "?" : ""}: ${type};`;
      })
      .join("\n");
  });

  // Helper adicional para processar campos com configurações do Swagger
  plop.setHelper("splitFields", function (fields) {
    if (!fields) return [];

    const fieldList = fields
      .split(";")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((field) => {
        // Formato esperado: name: type [validator] [required] [example:valor]
        const parts = field.split(":");
        const name = parts[0].trim();
        let type = parts.length > 1 ? parts[1].trim() : "string";

        // Extrair parâmetros adicionais
        const required = !field.includes("[optional]");

        // Detectar validador apropriado com base no tipo
        let validator = "IsString()";
        if (type.includes("number")) validator = "IsNumber()";
        if (type.includes("boolean")) validator = "IsBoolean()";
        if (type.includes("Date")) validator = "IsDate()";
        if (type.includes("email") || name.includes("email"))
          validator = "IsEmail()";

        // Extrair exemplo
        let example = '"Exemplo"';
        if (type.includes("number")) example = "0";
        if (type.includes("boolean")) example = "false";
        if (type.includes("Date")) example = "new Date()";
        if (type.includes("email") || name.includes("email"))
          example = '"exemplo@email.com"';

        // Verificar se há um exemplo personalizado
        const exampleMatch = field.match(/\[example:(.*?)\]/);
        if (exampleMatch) {
          let exampleValue = exampleMatch[1].trim();
          // Verificar se o exemplo já tem aspas, caso contrário adicionar aspas duplas para strings
          if (
            type.includes("string") &&
            !exampleValue.startsWith('"') &&
            !exampleValue.startsWith("'")
          ) {
            exampleValue = `"${exampleValue}"`;
          }
          example = exampleValue;
        }

        // Limpar o tipo de qualquer modificador
        type = type.split(" ")[0];

        return { name, type, validator, required, example };
      });

    return fieldList;
  });

  plop.setActionType("swaggerDeps", function () {
    return new Promise((resolve, reject) => {
      execSync("npm install --save @nestjs/swagger swagger-ui-express");
      resolve();
    });
  });

  plop.setGenerator("swagger", {
    description: "Prepara o ambiente para o uso de swagger",
    prompts: [],
    actions: [
      {
        type: "add",
        path: "src/utils/swagger.util.ts",
        templateFile: "plop-templates/utils/swagger.util.hbs",
      },
      {
        type: "swaggerDeps",
      },
    ],
  });

  plop.setActionType("encryptDeps", function () {
    return new Promise((resolve, reject) => {
      execSync("npm install --save bcrypt");
      execSync("npm install --save-dev @types/bcrypt");
      resolve();
    });
  });

  plop.setGenerator("encrypt", {
    description: "Prepara o ambiente para o uso de encrypt",
    prompts: [],
    actions: [
      {
        type: "add",
        path: "src/utils/encrypt.util.ts",
        templateFile: "plop-templates/utils/encrypt.util.hbs",
      },
      {
        type: "encryptDeps",
      },
    ],
  });

  plop.setActionType("databaseDeps", function () {
    return new Promise((resolve, reject) => {
      try {
        execSync("npm install --save knex pg nestjs-knex");
        execSync("npm install --save-dev @types/knex");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  plop.setGenerator("database", {
    description: "Gera um módulo de banco de dados",
    prompts: [],
    actions: [
      {
        type: "add",
        path: "knexfile.ts",
        templateFile: "plop-templates/database/knexfile.hbs",
      },
      {
        type: "add",
        path: "src/infra/database/database.providers.ts",
        templateFile: "plop-templates/database/providers.hbs",
      },
      {
        type: "add",
        path: "src/infra/database/database.module.ts",
        templateFile: "plop-templates/database/module.hbs",
      },
      {
        type: "databaseDeps",
      },
    ],
  });

  plop.setActionType("s3Deps", function () {
    return new Promise((resolve, reject) => {
      try {
        execSync(
          "npm install --save sharp @aws-sdk/client-s3 @aws-sdk/s3-request-presigner"
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  plop.setGenerator("s3", {
    description: "Gera um módulo de S3",
    prompts: [],
    actions: [
      {
        type: "add",
        path: "src/infra/s3/s3.interface.ts",
        templateFile: "plop-templates/s3/s3.interface.hbs",
      },
      {
        type: "add",
        path: "src/infra/s3/s3.service.ts",
        templateFile: "plop-templates/s3/s3.service.hbs",
      },
      {
        type: "add",
        path: "src/infra/s3/s3.service.spec.ts",
        templateFile: "plop-templates/s3/s3.service.spec.hbs",
      },
      {
        type: "add",
        path: "src/infra/s3/s3.module.ts",
        templateFile: "plop-templates/s3/s3.module.hbs",
      },
      {
        type: "s3Deps",
      },
    ],
  });

  plop.setActionType("emailsDeps", function () {
    return new Promise((resolve, reject) => {
      execSync("npm install --save nodemailer");
      execSync("npm install --save-dev @types/nodemailer");
      resolve();
    });
  });

  plop.setGenerator("emails", {
    description: "Gera um módulo de email",
    prompts: [],
    actions: [
      {
        type: "add",
        path: "src/infra/emails/emails.service.ts",
        templateFile: "plop-templates/emails/emails.service.hbs",
      },
      {
        type: "add",
        path: "src/infra/emails/emails.module.ts",
        templateFile: "plop-templates/emails/emails.module.hbs",
      },
      {
        type: "emailsDeps",
      },
    ],
  });

  plop.setActionType("authDeps", function () {
    return new Promise((resolve, reject) => {
      execSync("npm install --save @nestjs/jwt");
      resolve();
    });
  });

  plop.setGenerator("auth", {
    description: "Gera um módulo de autenticação",
    prompts: [],
    actions: [
      {
        type: "authDeps",
      },
      {
        type: "add",
        path: "src/modules/auth/decorators/current-user.decorator.ts",
        templateFile:
          "plop-templates/auth/decorators/current-user.decorator.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/decorators/public.decorator.ts",
        templateFile: "plop-templates/auth/decorators/public.decorator.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/interfaces/jwt-payload.interface.ts",
        templateFile:
          "plop-templates/auth/interfaces/jwt-payload.interface.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/mocks/auth.mocks.ts",
        templateFile: "plop-templates/auth/mocks/auth.mocks.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/dto/login.dto.ts",
        templateFile: "plop-templates/auth/dto/login.dto.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/dto/new-password.dto.ts",
        templateFile: "plop-templates/auth/dto/new-password.dto.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/dto/recovery-password.dto.ts",
        templateFile: "plop-templates/auth/dto/recovery-password.dto.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.constants.ts",
        templateFile: "plop-templates/auth/auth.constants.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.controller.ts",
        templateFile: "plop-templates/auth/auth.controller.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.controller.spec.ts",
        templateFile: "plop-templates/auth/auth.controller.spec.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.guard.ts",
        templateFile: "plop-templates/auth/auth.guard.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.interfaces.ts",
        templateFile: "plop-templates/auth/auth.interfaces.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.service.ts",
        templateFile: "plop-templates/auth/auth.service.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.service.spec.ts",
        templateFile: "plop-templates/auth/auth.service.spec.hbs",
      },
      {
        type: "add",
        path: "src/modules/auth/auth.module.ts",
        templateFile: "plop-templates/auth/auth.module.hbs",
      },
    ],
  });

  plop.setGenerator("module", {
    description: "Gera um módulo NestJS básico",
    prompts: [
      {
        type: "input",
        name: "module",
        message:
          "Qual o nome do módulo no plural (ex: Users, Product Categories)?",
      },
      {
        type: "input",
        name: "singular",
        message:
          "Qual o nome da entidade no singular (ex: User, ProductCategory)?",
      },
      {
        type: "input",
        name: "fields",
        message:
          "Defina os campos do DTO (ex: email: string [IsEmail()] [example:'user@example.com'])",
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/entities/{{kebabCase singular}}.entity.ts",
        templateFile: "plop-templates/module/entity.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/dto/create-{{kebabCase module}}.dto.ts",
        templateFile: "plop-templates/module/create.dto.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/dto/update-{{kebabCase module}}.dto.ts",
        templateFile: "plop-templates/module/update.dto.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/dto/params-{{kebabCase module}}.dto.ts",
        templateFile: "plop-templates/module/params.dto.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/{{kebabCase module}}.repository.ts",
        templateFile: "plop-templates/module/repository.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/{{kebabCase module}}.service.ts",
        templateFile: "plop-templates/module/service.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/{{kebabCase module}}.service.spec.ts",
        templateFile: "plop-templates/module/service.spec.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/{{kebabCase module}}.controller.ts",
        templateFile: "plop-templates/module/controller.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/{{kebabCase module}}.controller.spec.ts",
        templateFile: "plop-templates/module/controller.spec.hbs",
      },
      {
        type: "add",
        path: "src/modules/{{kebabCase module}}/{{kebabCase module}}.module.ts",
        templateFile: "plop-templates/module/module.hbs",
      },
    ],
  });

  plop.setGenerator("envFile", {
    description: "Gera um arquivo .env",
    prompts: [],
    actions: [
      {
        type: "add",
        path: ".env",
        templateFile: "plop-templates/env.hbs",
      },
    ],
  });
};
