import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Termos e Condições de Uso e Política de Privacidade – Gen.Oi</h1>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-gray-400">Última atualização: Maio de 2025</p>

          <p className="text-gray-300 mt-6">
            Ao se cadastrar e utilizar os serviços do Gen.Oi (plataforma operada pela empresa DATAHOLICS LTDA, CNPJ 08.761.268/0001-04), 
            você concorda com os termos abaixo. Eles explicam como usamos seus dados, o que você pode esperar da nossa plataforma, 
            e quais são seus direitos.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">1. O que é o Gen.Oi</h2>
          <p className="text-gray-300">
            O Gen.Oi é uma plataforma de inteligência artificial que ajuda empresas a resolverem desafios por meio da recomendação 
            de startups. O usuário descreve seu desafio, interage com uma IA estrategista e recebe indicações personalizadas de até 
            12 startups. O uso da plataforma é baseado em sistema de tokens, com uma quantidade inicial gratuita e possibilidade de 
            aquisição posterior.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Dados que coletamos</h2>
          <p className="text-gray-300">Coletamos os seguintes dados para prestar nossos serviços:</p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>Informações fornecidas por você no cadastro (nome, e-mail, empresa, desafio, etc.)</li>
            <li>Dados de uso da plataforma (navegação, interações com a IA, tokens consumidos)</li>
            <li>Informações técnicas (IP, localização aproximada, dispositivo usado)</li>
          </ul>
          <p className="text-gray-300 mt-4">
            A base legal para o uso desses dados é o seu consentimento e/ou a execução do contrato de uso da plataforma.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Como usamos seus dados</h2>
          <p className="text-gray-300">Utilizamos seus dados para:</p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>Oferecer a experiência personalizada com a IA</li>
            <li>Recomendar startups alinhadas aos seus desafios</li>
            <li>Comunicar melhorias, ofertas e alertas sobre o uso da plataforma</li>
            <li>Cumprir obrigações legais e garantir a segurança da plataforma</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Compartilhamento de dados</h2>
          <p className="text-gray-300">Seus dados não serão vendidos. Podemos compartilhar informações apenas quando:</p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>Houver exigência legal ou judicial</li>
            <li>For necessário para prestadores de serviço operarem a plataforma (sob acordo de confidencialidade)</li>
            <li>Com startups recomendadas, somente com seu consentimento explícito</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Seus direitos como usuário</h2>
          <p className="text-gray-300">Você pode, a qualquer momento:</p>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>Confirmar se tratamos seus dados</li>
            <li>Acessar, corrigir ou excluir seus dados</li>
            <li>Revogar seu consentimento</li>
            <li>Solicitar portabilidade</li>
            <li>Solicitar anonimização ou bloqueio</li>
          </ul>
          <p className="text-gray-300 mt-4">
            Para exercer qualquer desses direitos, entre em contato pelo WhatsApp ou e-mail disponível no site.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Segurança e armazenamento</h2>
          <p className="text-gray-300">
            Seus dados são armazenados com segurança, com medidas técnicas para proteger a confidencialidade e integridade das 
            informações. Mesmo assim, nenhum sistema é 100% imune a falhas ou ataques. Em caso de incidente com risco relevante, 
            você será notificado, e comunicaremos a ANPD conforme a LGPD.
          </p>
          <p className="text-gray-300 mt-4">
            Os dados são armazenados apenas pelo tempo necessário para prestação do serviço ou cumprimento de obrigações legais.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Conta e exclusão</h2>
          <p className="text-gray-300">
            Você pode excluir sua conta a qualquer momento pela interface do site. Isso encerrará seu acesso, removerá os dados 
            não obrigatórios por lei, e encerrará o uso dos tokens.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Uso da plataforma</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-2">
            <li>Ao se cadastrar, você ganha tokens para uso inicial gratuito</li>
            <li>Após o uso dos tokens gratuitos, é possível adquirir novos tokens ou planos pagos</li>
            <li>O uso indevido da plataforma, tentativas de manipulação da IA ou geração de dados falsos poderá resultar em suspensão da conta</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">9. Atualizações deste documento</h2>
          <p className="text-gray-300">
            Podemos atualizar estes Termos e Condições a qualquer momento. Avisaremos sobre mudanças importantes por e-mail ou 
            dentro da plataforma. O uso contínuo do Gen.Oi após uma atualização indica que você aceita os novos termos.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">10. Contato</h2>
          <p className="text-gray-300">
            Em caso de dúvidas, solicitações ou exercício de direitos, fale com a equipe Gen.Oi pelo WhatsApp no site 
            https://genoibot.com ou pelo e-mail informado na página de contato.
          </p>

          <p className="text-gray-300 mt-8">
            Ao continuar navegando e utilizando o Gen.Oi, você declara que leu, compreendeu e concorda com estes Termos e Condições.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;