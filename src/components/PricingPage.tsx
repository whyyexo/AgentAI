import { Check, Zap, Crown, TrendingUp } from 'lucide-react';

type PricingPageProps = {
  onClose: () => void;
};

export function PricingPage({ onClose }: PricingPageProps) {
  const plans = [
    {
      name: 'Free',
      icon: Zap,
      price: '$0',
      period: 'forever',
      description: 'Perfect to get started',
      features: [
        '1 AI Agent',
        '100 messages/month',
        'Basic integrations',
        'Community support',
        'Email notifications',
      ],
      limitations: ['Limited to 1 agent', 'Basic features only'],
      buttonText: 'Current Plan',
      buttonClass: 'bg-gray-800 text-white cursor-not-allowed',
      popular: false,
    },
    {
      name: 'Pro',
      icon: Crown,
      price: '$29',
      period: '/month',
      description: 'For professionals and teams',
      features: [
        'Unlimited AI Agents',
        'Unlimited messages',
        'All integrations',
        'Priority support',
        'Advanced analytics',
        'Custom instructions',
        'API access',
        'Team collaboration',
      ],
      buttonText: 'Upgrade to Pro',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      popular: true,
    },
    {
      name: 'Pay-as-you-go',
      icon: TrendingUp,
      price: '$0.01',
      period: '/message',
      description: 'Scale as you grow',
      features: [
        'Unlimited AI Agents',
        'Pay only for what you use',
        'All integrations',
        'Priority support',
        'Advanced analytics',
        'No monthly commitment',
        'Volume discounts',
      ],
      buttonText: 'Start PAYG',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative bg-gray-900 border rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-gray-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors mb-6 ${plan.buttonClass}`}
                >
                  {plan.buttonText}
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations?.map((limitation, index) => (
                    <div key={`limit-${index}`} className="flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <div className="w-1 h-3 bg-gray-600 rounded mx-auto"></div>
                      </div>
                      <span className="text-gray-500 text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Need a custom solution?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            For enterprises with specific needs, we offer custom plans with dedicated support,
            SLA guarantees, and on-premise deployment options.
          </p>
          <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
