export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-sm text-primary font-semibold tracking-wide uppercase">
          Verify
        </p>
        <h1 className="text-3xl font-bold">Check your email to continue</h1>
        <p className="text-muted-foreground">
          We sent a verification link to your inbox. Click the link to finish
          signing in. This page will be updated once verification is complete.
        </p>
      </div>
    </div>
  );
}

