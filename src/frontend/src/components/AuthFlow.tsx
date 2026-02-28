import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, ShieldCheck, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCompleteLogin,
  useInitiateLogin,
  useSaveCredentials,
} from "../hooks/useQueries";

interface AuthFlowProps {
  onSuccess: () => void;
}

export function AuthFlow({ onSuccess }: AuthFlowProps) {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  const saveCredentials = useSaveCredentials();
  const initiateLogin = useInitiateLogin();
  const completeLogin = useCompleteLogin();

  const isStep1Loading = saveCredentials.isPending || initiateLogin.isPending;
  const isStep2Loading = completeLogin.isPending;

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!consumerKey || !consumerSecret || !mobileNumber) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await saveCredentials.mutateAsync({
        consumerKey,
        consumerSecret,
        mobileNumber,
      });
      const result = await initiateLogin.mutateAsync({
        consumerKey,
        consumerSecret,
        mobileNumber,
      });
      toast.success(result || "OTP sent to your mobile number");
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Login failed: ${msg}`);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || !password) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      const result = await completeLogin.mutateAsync({ otp, password });
      toast.success(result || "Login successful!");
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Authentication failed: ${msg}`);
    }
  }

  return (
    <div className="min-h-screen bg-background terminal-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              InstaTrader
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Kotak Neo Trading Terminal
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg overflow-hidden shadow-card"
        >
          {/* Steps indicator */}
          <div className="flex border-b border-border">
            <div
              className={`flex-1 py-3 text-xs text-center font-medium transition-colors ${
                step === "credentials"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                Credentials
              </span>
            </div>
            <div
              className={`flex-1 py-3 text-xs text-center font-medium transition-colors ${
                step === "otp"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Verify OTP
              </span>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === "credentials" ? (
                <motion.form
                  key="credentials"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleStep1}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Consumer Key
                    </Label>
                    <Input
                      value={consumerKey}
                      onChange={(e) => setConsumerKey(e.target.value)}
                      placeholder="Enter your consumer key"
                      className="bg-input border-border font-mono text-sm h-9"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Consumer Secret
                    </Label>
                    <Input
                      type="password"
                      value={consumerSecret}
                      onChange={(e) => setConsumerSecret(e.target.value)}
                      placeholder="Enter your consumer secret"
                      className="bg-input border-border font-mono text-sm h-9"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Mobile Number
                    </Label>
                    <Input
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+91 XXXXXXXXXX"
                      className="bg-input border-border font-mono text-sm h-9"
                      autoComplete="tel"
                      type="tel"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm font-medium mt-2"
                    disabled={isStep1Loading}
                  >
                    {isStep1Loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleStep2}
                  className="space-y-4"
                >
                  <div className="bg-primary/10 border border-primary/20 rounded p-3 mb-4">
                    <p className="text-xs text-primary">
                      OTP sent to{" "}
                      <span className="font-mono font-medium">
                        {mobileNumber}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      OTP
                    </Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className="bg-input border-border font-mono text-sm h-9 tracking-widest"
                      maxLength={6}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Trading Password
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter trading password"
                      className="bg-input border-border font-mono text-sm h-9"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-9 text-sm border-border"
                      onClick={() => setStep("credentials")}
                      disabled={isStep2Loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm font-medium"
                      disabled={isStep2Loading}
                    >
                      {isStep2Loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground text-center">
              Your credentials are encrypted and stored on-chain.
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
