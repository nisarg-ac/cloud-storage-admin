import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, sendOtp, isSuperAdminEmail } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Cloud, ArrowLeft } from "lucide-react";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"email" | "otp">("email");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const setAuth = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isSuperAdminEmail(email)) {
                // If superadmin email, show OTP screen immediately
                setStep("otp");
            } else {
                // Otherwise, send OTP then show OTP screen
                await sendOtp(email);
                setStep("otp");
            }
        } catch (err: unknown) {
            console.log("🚀 ~ handleEmailSubmit ~ err:", err)
            setError((err as Error).message || "Failed to initiate login");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { token, user } = await login(email, otp);
            setAuth(token, user);
            navigate("/dashboard");
        } catch (err: unknown) {
            setError((err as Error).message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
            <Card className="w-full max-w-md shadow-lg border-0 ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <Cloud size={24} />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
                    <CardDescription>
                        {step === "email" ? "Sign in to manage cloud storage" : `Verify identity for ${email}`}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={step === "email" ? handleEmailSubmit : handleLogin}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/30 dark:border-red-900">
                                {error}
                            </div>
                        )}

                        {step === "email" ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@cloudapp.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium leading-none" htmlFor="otp">OTP Code</label>
                                    <button
                                        type="button"
                                        onClick={() => setStep("email")}
                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                                    >
                                        <ArrowLeft size={12} className="mr-1" /> Change Email
                                    </button>
                                </div>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" type="submit" disabled={loading}>
                            {loading
                                ? (step === "email" ? "Checking..." : "Signing in...")
                                : (step === "email" ? "Continue" : "Sign in")
                            }
                        </Button>
                        {step === "otp" && !isSuperAdminEmail(email) && (
                            <button
                                type="button"
                                onClick={() => sendOtp(email)}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                disabled={loading}
                            >
                                Resend OTP code
                            </button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
