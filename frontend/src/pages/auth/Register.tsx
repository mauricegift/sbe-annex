import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI } from "../../lib/api";
import { toast } from "../../lib/toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Eye, EyeOff, AlertCircle, Smartphone, Check, X, Loader2 } from "lucide-react";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";

const calculatePasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (score <= 2) return { score: (score / 6) * 100, label: "Weak", color: "bg-destructive" };
  if (score <= 4) return { score: (score / 6) * 100, label: "Medium", color: "bg-yellow-500" };
  return { score: (score / 6) * 100, label: "Strong", color: "bg-green-500" };
};

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    year_of_study: "",
    semester_of_study: "",
    verification_method: "email" as "email" | "sms",
    phone_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingFirst, setIsCheckingFirst] = useState(true);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [iconPulse, setIconPulse] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setIconPulse(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const firstUserRes = await authAPI.checkFirstUser();
        setIsFirstUser(firstUserRes.data?.is_first_user ?? false);
      } catch {
        setIsFirstUser(false);
      } finally {
        setIsCheckingFirst(false);
      }
    };
    init();
  }, []);

  const validateForm = () => {
    const newErrors: string[] = [];
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.push("Username can only contain letters, numbers, and underscores");
    if (formData.username.length < 3) newErrors.push("Username must be at least 3 characters");
    if (formData.name.trim().split(/\s+/).length < 2) newErrors.push("Full name must contain at least 2 names");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.push("Please enter a valid email address");
    if (formData.password.length < 8) newErrors.push("Password must be at least 8 characters long");
    if (!/[A-Z]/.test(formData.password)) newErrors.push("Password must contain at least 1 capital letter");
    if (!/[a-z]/.test(formData.password)) newErrors.push("Password must contain at least 1 small letter");
    if (!/[0-9]/.test(formData.password)) newErrors.push("Password must contain at least 1 number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) newErrors.push("Password must contain at least 1 special character");
    if (formData.password !== formData.confirmPassword) newErrors.push("Passwords do not match");
    if (!formData.year_of_study || !formData.semester_of_study) newErrors.push("Please select your year and semester of study");
    if (formData.verification_method === "sms") {
      if (!formData.phone_number) newErrors.push("Phone number is required for SMS verification");
      else if (!/^(07|01)[0-9]{8}$/.test(formData.phone_number)) newErrors.push("Please enter a valid Kenyan phone number (e.g., 0712345678)");
    }
    if (!acceptedTerms) newErrors.push("You must accept the Terms and Conditions to register");
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }
    setErrors([]);
    setIsLoading(true);
    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        name: formData.name,
        password: formData.password,
        year_of_study: parseInt(formData.year_of_study),
        semester_of_study: parseInt(formData.semester_of_study),
        verification_method: formData.verification_method,
      };
      if (formData.phone_number) payload.phone_number = formData.phone_number;
      await register(payload);
      navigate("/verify", {
        state: {
          email: formData.email,
          phone_number: formData.phone_number,
          verification_method: formData.verification_method,
        },
      });
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "username" ? value.toLowerCase() : value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const inputClass = (field: string) =>
    `h-12 transition-all duration-300 border-2 bg-background/50 backdrop-blur-sm ${
      focusedField === field ? "border-primary/50 ring-4 ring-primary/10" : "border-border/50 hover:border-primary/30"
    }`;

  if (isCheckingFirst) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-lg space-y-6 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              <img src="/android-chrome-512x512.png" alt="SBE Annex Logo"
                className={`w-full h-full object-cover transition-all duration-300 ${iconPulse ? "scale-105" : "scale-100"} ${isHovering ? "rotate-12" : ""}`} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Join SBE Annex</h1>
            <p className="text-muted-foreground text-sm mt-1">Create your account to access study materials</p>
            {isFirstUser && (
              <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
                First account — you will be Super Admin
              </Badge>
            )}
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            {errors.length > 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {errors.map((err, i) => <p key={i} className="text-sm text-destructive">{err}</p>)}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input id="name" name="name" type="text" placeholder="John Doe"
                    value={formData.name} onChange={handleChange}
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                    required className={inputClass("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username *</Label>
                  <Input id="username" name="username" type="text" placeholder="johndoe"
                    value={formData.username} onChange={handleChange}
                    onFocus={() => setFocusedField("username")} onBlur={() => setFocusedField(null)}
                    required className={`${inputClass("username")} lowercase`} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <Input id="email" name="email" type="email" placeholder="user@example.com"
                  value={formData.email} onChange={handleChange}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  required className={inputClass("email")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-sm font-medium">
                  Phone Number {formData.verification_method === "sms" ? "*" : "(optional)"}
                </Label>
                <div className="relative">
                  <Input id="phone_number" name="phone_number" type="tel" placeholder="0712345678"
                    value={formData.phone_number} onChange={handleChange}
                    onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                    className={`${inputClass("phone")} pr-10`} />
                  <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Required for SMS verification. Optional for email verification.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Year of Study *</Label>
                  <Select value={formData.year_of_study} onValueChange={v => handleSelectChange("year_of_study", v)}>
                    <SelectTrigger className={`h-12 border-2 ${focusedField === "year" ? "border-primary/50" : "border-border/50"}`}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Semester *</Label>
                  <Select value={formData.semester_of_study} onValueChange={v => handleSelectChange("semester_of_study", v)}>
                    <SelectTrigger className="h-12 border-2 border-border/50">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Verification Method *</Label>
                <Select value={formData.verification_method} onValueChange={v => handleSelectChange("verification_method", v)}>
                  <SelectTrigger className="h-12 border-2 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Verification (link to inbox) — Recommended</SelectItem>
                    <SelectItem value="sms">SMS Verification (6-digit code to phone)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.verification_method === "sms"
                    ? "A 6-digit code will be sent to your phone number."
                    : "A verification link will be sent to your email address."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password" value={formData.password} onChange={handleChange}
                    onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                    required className={`${inputClass("password")} pr-12`} />
                  <Button type="button" variant="ghost" size="icon"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-primary/10"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Strength:</span>
                      <span className={`font-medium ${calculatePasswordStrength(formData.password).label === "Weak" ? "text-destructive" : calculatePasswordStrength(formData.password).label === "Medium" ? "text-yellow-600" : "text-green-600"}`}>
                        {calculatePasswordStrength(formData.password).label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${calculatePasswordStrength(formData.password).color}`}
                        style={{ width: `${calculatePasswordStrength(formData.password).score}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        { label: "8+ chars", test: formData.password.length >= 8 },
                        { label: "Uppercase", test: /[A-Z]/.test(formData.password) },
                        { label: "Lowercase", test: /[a-z]/.test(formData.password) },
                        { label: "Number", test: /[0-9]/.test(formData.password) },
                        { label: "Special char", test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), fullWidth: true },
                      ].map((rule, i) => (
                        <div key={i} className={`flex items-center gap-1 ${rule.test ? "text-green-600" : "text-muted-foreground"} ${(rule as any).fullWidth ? "col-span-2" : ""}`}>
                          {rule.test ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange}
                    onFocus={() => setFocusedField("confirmPassword")} onBlur={() => setFocusedField(null)}
                    required className={`${inputClass("confirmPassword")} pr-12`} />
                  <Button type="button" variant="ghost" size="icon"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-primary/10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {formData.confirmPassword && (
                  <p className={`text-xs flex items-center gap-1 ${formData.password === formData.confirmPassword ? "text-green-600" : "text-destructive"}`}>
                    {formData.password === formData.confirmPassword
                      ? <><Check className="w-3 h-3" />Passwords match</>
                      : <><X className="w-3 h-3" />Passwords do not match</>}
                  </p>
                )}
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={c => setAcceptedTerms(c === true)}
                  className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link>{" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              <Button type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium"
                disabled={isLoading || !acceptedTerms}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Account...</> : "Create Account"}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in here</Link>
            </div>
          </CardContent>
        </Card>

        {isFirstUser ? (
          <p className="text-center text-xs text-muted-foreground">
            As the first user, you will be the Super Admin. You can add groups and specializations from the admin panel after signing up.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Study group can be updated later from your Profile page.
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
