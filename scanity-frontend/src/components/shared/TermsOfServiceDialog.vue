<template>
  <q-dialog v-model="dialogOpen" persistent>
    <q-card class="terms-dialog-card" style="width: 1200px; max-width: 80vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="description" class="q-mr-sm" />
          Termos de Serviço
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-scroll-area class="terms-scroll">
          <div class="terms-content text-body2">
            <p class="text-weight-medium">Última atualização: Fevereiro de 2025</p>

            <p>
              Estes Termos de Serviço ("Termos") regem o uso da plataforma <strong>Scanity</strong>,
              sistema de gerenciamento de estoque. Ao acessar ou utilizar o serviço, você concorda
              com estes Termos. Caso não concorde, não utilize a plataforma.
            </p>

            <h6 class="q-mt-md q-mb-sm">1. Aceitação dos Termos</h6>
            <p>
              O uso do Scanity implica aceitação integral destes Termos e da nossa Política de
              Privacidade. O responsável pela conta deve garantir que todos os usuários vinculados à
              mesma estejam cientes e em conformidade com estas condições.
            </p>

            <h6 class="q-mt-md q-mb-sm">2. Descrição do Serviço</h6>
            <p>
              O Scanity é uma ferramenta de gestão de estoque que permite cadastrar produtos,
              categorias, fornecedores e clientes; registrar entradas e saídas; realizar contagem de
              inventário; acompanhar níveis de estoque e gerar relatórios. O serviço é oferecido
              conforme a modalidade de assinatura/plano contratado, podendo incluir limites de
              usuários, produtos ou funcionalidades.
            </p>

            <h6 class="q-mt-md q-mb-sm">3. Cadastro e Conta</h6>
            <p>
              É necessário cadastro e conta ativa para utilizar o serviço. O usuário é responsável
              por manter a confidencialidade das credenciais de acesso e por todas as atividades
              realizadas em sua conta. Deve informar imediatamente qualquer uso não autorizado. A
              conta é pessoal e intransferível, salvo acordo expresso com o provedor do serviço.
            </p>

            <h6 class="q-mt-md q-mb-sm">4. Uso Aceitável</h6>
            <p>O usuário compromete-se a:</p>
            <ul>
              <li>
                Utilizar o sistema apenas para fins legítimos de gestão de estoque e negócios.
              </li>
              <li>Fornecer informações verdadeiras e manter dados cadastrais atualizados.</li>
              <li>
                Não utilizar o serviço para atividades ilegais, fraudulentas ou que violem direitos
                de terceiros.
              </li>
              <li>
                Não tentar acessar áreas restritas, outros usuários ou contas sem autorização.
              </li>
              <li>Não interferir na infraestrutura, segurança ou disponibilidade do serviço.</li>
              <li>Respeitar as leis aplicáveis e as políticas do provedor.</li>
            </ul>
            <p>
              O descumprimento pode resultar em suspensão ou encerramento da conta, sem prejuízo de
              outras medidas legais.
            </p>

            <h6 class="q-mt-md q-mb-sm">5. Propriedade Intelectual e Licença</h6>
            <p>
              O Scanity, incluindo software, interface, marcas e conteúdos técnicos, é de
              propriedade do provedor ou de seus licenciadores. É concedida ao usuário apenas uma
              licença limitada, não exclusiva e revogável para uso do serviço durante a vigência do
              contrato. Nenhum direito de propriedade sobre a plataforma é transferido ao usuário.
            </p>

            <h6 class="q-mt-md q-mb-sm">6. Dados e Conteúdo do Usuário</h6>
            <p>
              O usuário mantém a propriedade dos dados que insere no sistema (produtos, estoque,
              fornecedores, clientes etc.). O provedor atua como processador desses dados, em
              conformidade com a Política de Privacidade e com a legislação de proteção de dados. O
              usuário é responsável pelo conteúdo que cadastra e garante que possui direito para
              utilizá-lo no serviço.
            </p>

            <h6 class="q-mt-md q-mb-sm">7. Disponibilidade e Suporte</h6>
            <p>
              O provedor se esforça para manter o serviço disponível, mas não garante
              disponibilidade ininterrupta. Manutenções programadas podem ser comunicadas com
              antecedência. O suporte técnico é oferecido conforme o plano contratado e pelos canais
              indicados na plataforma.
            </p>

            <h6 class="q-mt-md q-mb-sm">8. Limitação de Responsabilidade</h6>
            <p>
              O serviço é fornecido "como está". Na máxima extensão permitida por lei, o provedor
              não se responsabiliza por danos indiretos, incidentais, especiais ou consequenciais
              (incluindo perda de lucros ou dados) decorrentes do uso ou da impossibilidade de uso
              do Scanity. A responsabilidade total do provedor está limitada ao valor efetivamente
              pago pelo usuário nos últimos 12 (doze) meses relativos ao serviço que deu origem à
              reclamação, salvo em casos de dolo ou culpa grave.
            </p>

            <h6 class="q-mt-md q-mb-sm">9. Rescisão</h6>
            <p>
              O usuário pode encerrar o uso do serviço a qualquer momento, conforme as regras do
              plano (cancelamento, aviso prévio etc.). O provedor pode suspender ou encerrar o
              acesso em caso de violação destes Termos, inadimplência ou por decisão comercial, com
              aviso quando razoável. Após o encerramento, o usuário poderá solicitar exportação dos
              dados dentro do prazo informado na plataforma.
            </p>

            <h6 class="q-mt-md q-mb-sm">10. Alterações nos Termos</h6>
            <p>
              O provedor pode alterar estes Termos. Alterações relevantes serão comunicadas por meio
              do sistema ou e-mail. O uso continuado do serviço após a vigência das alterações
              constitui aceitação dos novos Termos. Em caso de discordância, o usuário deve deixar
              de utilizar o serviço e poderá rescindir conforme o plano.
            </p>

            <h6 class="q-mt-md q-mb-sm">11. Lei Aplicável e Foro</h6>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. As disputas
              serão submetidas ao foro da comarca do domicílio do provedor, com renúncia a qualquer
              outro, por mais privilegiado que seja.
            </p>

            <h6 class="q-mt-md q-mb-sm">12. Contato</h6>
            <p>
              Para dúvidas sobre estes Termos ou sobre o serviço Scanity, utilize o canal de suporte
              disponível na sua conta ou o e-mail de contato informado no cadastro ou no site
              oficial.
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
.terms-dialog-card {
  min-width: 400px;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.terms-scroll {
  height: 60vh;
  min-height: 300px;
}

.terms-content :deep(h6) {
  font-size: 0.95rem;
  font-weight: 600;
  color: inherit;
}

.terms-content :deep(ul) {
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

.terms-content :deep(li) {
  margin-bottom: 0.35rem;
}

.terms-content :deep(p) {
  margin: 0.5rem 0;
  line-height: 1.5;
}
</style>
