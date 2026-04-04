# Sistema de Templates de Email

Este sistema permite enviar emails usando templates Handlebars reutilizáveis e bem estruturados.

## 📁 Estrutura de Arquivos

```
src/infra/emails/
├── templates/
│   ├── base.hbs          # Template base comum
│   ├── recovery-password.hbs  # Template de recuperação de senha
│   ├── changed-password.hbs   # Template de senha alterada
│   ├── account-confirmation.hbs # Template de confirmação de conta
│   ├── account-confirmed.hbs    # Template de conta confirmada
│   └── generic.hbs       # Template genérico para diversos usos
├── interfaces/
│   └── email-template.interface.ts  # Interfaces TypeScript
├── emails.service.ts     # Serviço principal
├── emails.module.ts      # Módulo NestJS
└── README.md            # Esta documentação
```

## 🚀 Como Usar

### 1. Emails Pré-definidos

#### Recuperação de Senha

```typescript
await emailsService.sendRecoveryPasswordMail(
  'usuario@exemplo.com',
  'TOKEN123ABC',
);
```

#### Confirmação de Senha Alterada

```typescript
await emailsService.sendChangedPasswordMail('usuario@exemplo.com');
```

#### Confirmação de Conta

```typescript
// Confirmação básica com apenas email e token
await emailsService.sendAccountConfirmationMail(
  'usuario@exemplo.com',
  'TOKEN123ABC',
);

// Confirmação personalizada com nome do usuário
await emailsService.sendAccountConfirmationMail(
  'usuario@exemplo.com',
  'TOKEN123ABC',
  'Nome do Usuário', // Opcional
);
```

#### Conta Confirmada com Sucesso

```typescript
// Email básico de conta confirmada
await emailsService.sendAccountConfirmedMail('usuario@exemplo.com');

// Com nome personalizado
await emailsService.sendAccountConfirmedMail(
  'usuario@exemplo.com',
  'Nome do Usuário',
);

// Completo com recursos da plataforma
await emailsService.sendAccountConfirmedMail(
  'usuario@exemplo.com',
  'Nome do Usuário',
  [
    'Conversas com IA especializada',
    'Monitoramento de bem-estar',
    'Exercícios personalizados',
    'Suporte 24/7',
  ],
);
```

### 2. Email Genérico Customizado

```typescript
import { GenericTemplateData } from './interfaces/email-template.interface';

const templateData: GenericTemplateData = {
  greeting: 'Olá! 👋',
  message: 'Sua mensagem personalizada aqui.',
  content: '<p>Conteúdo HTML adicional</p>',
  actionUrl: 'https://exemplo.com/acao',
  actionText: 'Botão de Ação',
  note: 'Observação importante (opcional)',
};

await emailsService.sendGenericTemplateEmail(
  'usuario@exemplo.com',
  'Assunto do Email',
  templateData,
);
```

## 🎨 Templates Disponíveis

### Template Base (`base.hbs`)

- Layout comum para todos os emails
- Inclui cabeçalho, rodapé e estilos CSS
- Recebe o conteúdo do template específico

### Template de Recuperação de Senha (`recovery-password.hbs`)

- Formulário de recuperação de senha
- Inclui código de recuperação e link
- Aviso de segurança

### Template de Senha Alterada (`changed-password.hbs`)

- Confirmação de alteração de senha
- Timestamp da alteração
- Informações de segurança

### Template de Confirmação de Conta (`account-confirmation.hbs`)

- Email de boas-vindas para novos usuários
- Código de confirmação e link de ativação
- Saudação personalizada (opcional com nome do usuário)
- Informações de segurança

### Template de Conta Confirmada (`account-confirmed.hbs`)

- Email de parabéns por conta confirmada com sucesso
- Botão de acesso à plataforma
- Lista opcional de recursos disponíveis
- Dicas de uso e suporte
- Design celebrativo e motivacional

### Template Genérico (`generic.hbs`)

- Flexível para diferentes tipos de email
- Suporte a conteúdo HTML customizado
- Botões de ação opcionais
- Notas e avisos opcionais

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Configurações de Email
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=seu_usuario
MAIL_PASS=sua_senha
MAIL_SENDER=Plataforma <naoresponda@plataforma.com.br>

# Configurações da Aplicação
PLATFORM_NAME=Plataforma
FRONTEND_URI=https://app.exemplo.com
```

## 🛠️ Criando Novos Templates

### 1. Criar o arquivo de template

Crie um novo arquivo `.hbs` em `src/infra/emails/templates/`:

```handlebars
<!-- meu-novo-template.hbs -->
<p>{{greeting}}</p>
<p>{{customMessage}}</p>
{{#if showButton}}
  <p style='text-align: center;'>
    <a href='{{buttonUrl}}' class='button'>{{buttonText}}</a>
  </p>
{{/if}}
```

### 2. Criar interface TypeScript

Adicione a interface em `email-template.interface.ts`:

```typescript
export interface MeuNovoTemplateData {
  greeting: string;
  customMessage: string;
  showButton?: boolean;
  buttonUrl?: string;
  buttonText?: string;
}

export type EmailTemplateType =
  | 'recovery-password'
  | 'changed-password'
  | 'account-confirmation'
  | 'account-confirmed'
  | 'generic'
  | 'meu-novo-template'; // Adicionar aqui
```

### 3. Criar método no serviço

Adicione um método público no `EmailsService`:

```typescript
async sendMeuNovoTemplate(
  to: string,
  templateData: MeuNovoTemplateData,
): Promise<SMTPTransport.SentMessageInfo> {
  return await this.sendTemplateEmail(
    to,
    'Assunto do Email',
    'meu-novo-template',
    templateData
  );
}
```

## 🎯 Boas Práticas

1. **Reutilização**: Use o template genérico para emails simples
2. **Responsividade**: Os templates são otimizados para mobile
3. **Acessibilidade**: Use cores com bom contraste e fontes legíveis
4. **Segurança**: Sempre valide dados antes de enviar
5. **Testes**: Teste os templates em diferentes clientes de email

## 📱 Classes CSS Disponíveis

- `.button` - Botão estilizado
- `.code` - Código destacado
- `.warning` - Caixa de aviso
- `.container` - Container principal
- `.header` - Cabeçalho
- `.content` - Conteúdo principal
- `.footer` - Rodapé

## 🔧 Troubleshooting

### Template não encontrado

Verifique se o arquivo `.hbs` existe em `src/infra/emails/templates/`

### Erro de compilação

Verifique a sintaxe Handlebars e se todas as variáveis estão definidas

### Email não enviado

Verifique as configurações SMTP nas variáveis de ambiente

## 📚 Referências

- [Handlebars.js](https://handlebarsjs.com/) - Engine de templates
- [Nodemailer](https://nodemailer.com/) - Biblioteca de email
- [NestJS](https://nestjs.com/) - Framework web
