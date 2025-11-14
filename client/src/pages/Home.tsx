import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [appUrl, setAppUrl] = useState("");

  const { data: botConfig } = trpc.bot.getConfig.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const saveConfigMutation = trpc.bot.saveConfig.useMutation({
    onSuccess: () => {
      setSuccessMessage("Webhook успешно настроен! Бот готов к работе.");
      toast.success("Конфигурация сохранена успешно");
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка при сохранении конфигурации");
      setIsSubmitting(false);
    },
  });

  // Set up app URL and webhook URL on mount
  useEffect(() => {
    const url = window.location.origin;
    setAppUrl(url);
    setWebhookUrl(`${url}/api/webhook`);
  }, []);

  // Load existing config if available
  useEffect(() => {
    if (botConfig) {
      setBotToken(botConfig.botToken);
      setWebhookUrl(botConfig.webhookUrl);
    }
  }, [botConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!botToken.trim()) {
      toast.error("Пожалуйста, введите токен бота");
      return;
    }

    if (!webhookUrl.trim()) {
      toast.error("Пожалуйста, введите webhook URL");
      return;
    }

    setIsSubmitting(true);
    await saveConfigMutation.mutateAsync({
      botToken: botToken.trim(),
      webhookUrl: webhookUrl.trim(),
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Telegram Бот для Заметок
          </h1>
          <p className="text-lg text-slate-600">
            Простой и быстрый способ сохранять свои мысли и идеи
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Features */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Возможности</CardTitle>
                <CardDescription>Что умеет бот</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-mono text-sm text-slate-700 mb-1">/start</p>
                    <p className="text-sm text-slate-600">Приветствие и список команд</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-mono text-sm text-slate-700 mb-1">/add текст заметки</p>
                    <p className="text-sm text-slate-600">Добавить новую заметку</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-mono text-sm text-slate-700 mb-1">/list</p>
                    <p className="text-sm text-slate-600">Показать все сохраненные заметки</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-mono text-sm text-slate-700 mb-1">/search запрос</p>
                    <p className="text-sm text-slate-600">Найти заметки по ключевому слову</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-mono text-sm text-slate-700 mb-1">/clear</p>
                    <p className="text-sm text-slate-600">Удалить все заметки</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">
                      Любое сообщение автоматически сохраняется как заметка
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Configuration */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Настройка бота</CardTitle>
                <CardDescription>Подключите бота к Telegram</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                      1
                    </div>
                    <h3 className="font-semibold text-slate-900">Создайте бота</h3>
                  </div>
                  <div className="ml-8 space-y-2 text-sm text-slate-600">
                    <p>1. Найдите @BotFather в Telegram</p>
                    <p>2. Отправьте команду /newbot</p>
                    <p>3. Следуйте инструкциям</p>
                    <p>4. Скопируйте токен бота</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                      2
                    </div>
                    <h3 className="font-semibold text-slate-900">Разверните приложение</h3>
                  </div>
                  <div className="ml-8 bg-blue-50 border border-blue-200 p-3 rounded text-sm text-slate-700">
                    Telegram API требует HTTPS URL для webhook. Нажмите "Publish" в правом верхнем углу, чтобы развернуть приложение на Vercel, затем вернитесь сюда для настройки.
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                      3
                    </div>
                    <h3 className="font-semibold text-slate-900">Введите токен</h3>
                  </div>
                  <div className="ml-8 space-y-4">
                    <div>
                      <Label htmlFor="bot-token" className="text-slate-700 font-medium">
                        Токен бота
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="bot-token"
                          type={showToken ? "text" : "password"}
                          placeholder="••••••••••••••••••••••••••••••••••••••"
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          className="pr-10"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        >
                          {showToken ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Токен из @BotFather (сохраняется в браузере)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="webhook-url" className="text-slate-700 font-medium">
                        Webhook URL
                      </Label>
                      <Input
                        id="webhook-url"
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="mt-2 bg-slate-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Автоматически заполнен на основе текущего URL
                      </p>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !botToken.trim()}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 h-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Настройка...
                        </>
                      ) : (
                        "Настроить бота"
                      )}
                    </Button>

                    {successMessage && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">{successMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
