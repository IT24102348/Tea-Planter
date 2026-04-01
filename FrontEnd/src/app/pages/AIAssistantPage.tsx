import { Bot, Sparkles, Cloud, Droplets, Sun, LineChart } from 'lucide-react';

export function AIAssistantPage() {
  const features = [
    {
      title: "Weather-Smart Planning",
      description: "Receive precision recommendations for fertilization and harvesting based on local micro-climate forecast.",
      icon: Cloud,
      color: "blue"
    },
    {
      title: "Yield Optimization",
      description: "AI-driven insights to identify high-performing blocks and optimize resource allocation.",
      icon: LineChart,
      color: "green"
    },
    {
      title: "Intelligent Scheduling",
      description: "Automated task prioritization for your workforce to ensure peak efficiency during peak seasons.",
      icon: Sun,
      color: "orange"
    },
    {
      title: "Inventory Insights",
      description: "Predictive analytics for fertilizers and tools to prevent shortages during critical operations.",
      icon: Droplets,
      color: "indigo"
    }
  ];

  return (
    <div className="p-6 min-h-[calc(100vh-96px)] flex flex-col items-center justify-center bg-gray-50/50">
      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-3xl mb-4 animate-bounce duration-[3000ms]">
            <Bot className="w-12 h-12 text-green-600" />
          </div>
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Scheduled for Release
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Estate Manager <span className="text-green-600">AI Assistant</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              We're building an intelligent companion to help you navigate the complexities of plantation management with data-driven precision.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const colorMap = {
              blue: "bg-blue-50 text-blue-600",
              green: "bg-green-50 text-green-600",
              orange: "bg-orange-50 text-orange-600",
              indigo: "bg-indigo-50 text-indigo-600"
            };
            
            return (
              <div 
                key={i} 
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorMap[feature.color as keyof typeof colorMap]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Notice Card */}
        <div className="bg-white border border-green-100 p-8 rounded-3xl shadow-sm relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50 rounded-full -ml-12 -mb-12 opacity-50" />
          
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Get Ready for Smarter Tea Planter</h2>
            <p className="text-gray-600 max-w-lg mx-auto">
              Our AI is currently training on localized estate data to provide you with the most accurate recommendations for your specific plantation.
            </p>
            <div className="pt-2 text-sm font-semibold text-green-600">
              Feature coming soon to all Estate Managers and Owners.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
