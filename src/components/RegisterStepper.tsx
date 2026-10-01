import StepIndicator from "@/components/ui/StepIndicator";

const STEPS = ["نوع حساب", "اطلاعات فردی", "ایمیل و رمز عبور"];

type RegisterStepperProps = {
  /** 1-indexed current step. */
  currentStep: number;
  onStepClick?: (step: number) => void;
};

export default function RegisterStepper({ currentStep, onStepClick }: RegisterStepperProps) {
  return <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={onStepClick} />;
}
