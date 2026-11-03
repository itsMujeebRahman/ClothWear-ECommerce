import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export default function NoAccessToCart() {
  return (
    <div className="flex items-center justify-center py-12 md:py-32 bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center">
            <Logo className="italic">ClothsWear</Logo>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome Back!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            Log in to view your cart items and checkout. Don&apos;t miss out on
            your favourite products.
          </p>
          <SignInButton mode="modal">
            <Button className="w-full font-semibold" size="lg">
              Sign In
            </Button>
          </SignInButton>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div>Don&apos;t have an Account?</div>
          <SignUpButton mode="modal">
            <Button variant="outline" className="w-full" size="lg">
              Create an Account
            </Button>
          </SignUpButton>
        </CardFooter>
      </Card>
    </div>
  );
}
