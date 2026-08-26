-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeFrameworkId_fkey" FOREIGN KEY ("activeFrameworkId") REFERENCES "Framework"("id") ON DELETE SET NULL ON UPDATE CASCADE;
