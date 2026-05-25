<template>
  <q-dialog v-model="dialogOpen" persistent>
    <q-card class="policy-dialog-card" style="width: 1200px; max-width: 80vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="policy" class="q-mr-sm" />
          Política de Privacidade
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-scroll-area class="policy-scroll">
          <div class="policy-content text-body2">
            <p class="text-weight-medium">Última atualização: Fevereiro de 2025</p>

            <p>
              Esta Política de Privacidade descreve como o <strong>Scanity</strong> (sistema de
              gerenciamento de estoque) coleta, utiliza, armazena e protege as informações dos
              usuários e das operações de estoque realizadas através da plataforma.
            </p>

            <h6 class="q-mt-md q-mb-sm">1. Dados que Coletamos</h6>
            <p>
              Coletamos informações necessárias para o funcionamento do sistema de gestão de
              estoque:
            </p>
            <ul>
              <li>
                <strong>Dados da conta e usuários:</strong> nome, e-mail, dados de login e tipo de
                usuário.
              </li>
              <li>
                <strong>Dados de produtos:</strong> descrição, código de barras, categorias,
                quantidades, estoque mínimo e demais informações cadastrais.
              </li>
              <li>
                <strong>Dados de estoque e movimentações:</strong> entradas, saídas, contagens de
                inventário, observações e histórico de alterações.
              </li>
              <li>
                <strong>Dados de fornecedores e clientes:</strong> nomes, contatos, documentos e
                endereços cadastrados para operações de compra e venda.
              </li>
              <li>
                <strong>Dados de uso:</strong> registros de acesso, ações realizadas no sistema e
                logs de auditoria para fins de segurança e suporte.
              </li>
            </ul>

            <h6 class="q-mt-md q-mb-sm">2. Finalidade do Tratamento</h6>
            <p>Utilizamos os dados para:</p>
            <ul>
              <li>Fornecer e manter o serviço de gerenciamento de estoque.</li>
              <li>Controlar acesso, autenticação e permissões por conta e usuário.</li>
              <li>Processar movimentações, relatórios e contagem de inventário.</li>
              <li>
                Enviar notificações relevantes ao uso do sistema (ex.: estoque abaixo do mínimo).
              </li>
              <li>Cumprir obrigações legais e regulatórias aplicáveis.</li>
              <li>Melhorar a segurança, performance e funcionalidades do produto.</li>
            </ul>

            <h6 class="q-mt-md q-mb-sm">3. Base Legal</h6>
            <p>
              O tratamento dos dados está fundamentado na execução do contrato de prestação do
              serviço, no legítimo interesse para operação e segurança do sistema e, quando
              aplicável, no consentimento do titular para finalidades específicas.
            </p>

            <h6 class="q-mt-md q-mb-sm">4. Compartilhamento de Dados</h6>
            <p>
              Não vendemos seus dados. Podemos compartilhar informações apenas com prestadores de
              serviços essenciais (hospedagem, infraestrutura, suporte), sob contrato e com
              obrigação de confidencialidade, ou quando exigido por lei ou ordem judicial.
            </p>

            <h6 class="q-mt-md q-mb-sm">5. Segurança e Retenção</h6>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso não
              autorizado, alteração, divulgação ou destruição. Os dados são mantidos pelo tempo
              necessário à prestação do serviço, exigências legais e resolução de disputas.
            </p>

            <h6 class="q-mt-md q-mb-sm">6. Seus Direitos</h6>
            <p>Você pode, conforme a lei aplicável:</p>
            <ul>
              <li>Acessar e corrigir seus dados pessoais (incluindo em "Meus Dados").</li>
              <li>Solicitar a exclusão ou portabilidade dos dados, quando cabível.</li>
              <li>
                Revogar consentimentos e opor-se a tratamentos com base em legítimo interesse.
              </li>
              <li>Apresentar reclamação perante a autoridade de proteção de dados.</li>
            </ul>

            <h6 class="q-mt-md q-mb-sm">7. Cookies e Tecnologias Similares</h6>
            <p>
              Utilizamos cookies e tecnologias similares para sessão, autenticação e preferências do
              usuário, necessários ao funcionamento da aplicação. Não utilizamos cookies de
              terceiros para publicidade no sistema de gestão de estoque.
            </p>

            <h6 class="q-mt-md q-mb-sm">8. Alterações</h6>
            <p>
              Esta política pode ser atualizada. Alterações relevantes serão comunicadas por meio do
              sistema ou e-mail. O uso continuado do serviço após as alterações constitui aceitação
              da nova versão.
            </p>

            <h6 class="q-mt-md q-mb-sm">9. Contato</h6>
            <p>
              Para dúvidas, exercício de direitos ou solicitações relacionadas à privacidade, entre
              em contato através do canal de suporte disponível na sua conta ou pelo e-mail de
              contato informado no momento do cadastro.
            </p>
          </div>
        </q-scroll-area>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Fechar" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const dialogOpen = ref(false);

const thumbStyle = {
  right: '4px',
  borderRadius: '4px',
  width: '6px',
  opacity: 0.6,
};

defineExpose({
  open: () => (dialogOpen.value = true),
  close: () => (dialogOpen.value = false),
});
</script>

<style scoped>
.policy-dialog-card {
  min-width: 400px;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.policy-scroll {
  height: 60vh;
  min-height: 300px;
}

.policy-content :deep(h6) {
  font-size: 0.95rem;
  font-weight: 600;
  color: inherit;
}

.policy-content :deep(ul) {
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

.policy-content :deep(li) {
  margin-bottom: 0.35rem;
}

.policy-content :deep(p) {
  margin: 0.5rem 0;
  line-height: 1.5;
}
</style>
