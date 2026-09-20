import StepIndicator from "@/components/ui/StepIndicator";

const STEPS = ["نوع حساب", "اطلاعات فردی", "ایمیل و رمز عبور"];

type RegisterStepperProps = {
  /** 1-indexed current step. */
  currentStep: number;
};

export default function RegisterStepper({ currentStep }: RegisterStepperProps) {
  return <StepIndicator steps={STEPS} currentStep={currentStep} />;
}
