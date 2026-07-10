import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const profiles = [
  "Administrador",
  "Diretoria",
  "Gerente",
  "Supervisor",
  "Operador",
  "Consulta",
] as const;

const modules = [
  { key: "dashboard", label: "Dashboard" },
  { key: "operacao", label: "Operação" },
  { key: "suprimentos", label: "Suprimentos" },
  { key: "administracao", label: "Administração" },
  { key: "usuarios", label: "Usuários" },
  { key: "perfis", label: "Perfis" },
  { key: "permissoes", label: "Permissões" },
  { key: "auditoria", label: "Auditoria" },
  { key: "configuracoes", label: "Configurações" },
  { key: "logs", label: "Logs" },
  { key: "backup", label: "Backup" },
] as const;

async function main() {
  for (const profileName of profiles) {
    await prisma.profile.upsert({
      where: { name: profileName },
      update: {},
      create: {
        name: profileName,
        description: `Perfil padrão ${profileName}`,
      },
    });
  }

  for (const moduleItem of modules) {
    await prisma.permission.upsert({
      where: { moduleKey: moduleItem.key },
      update: { moduleLabel: moduleItem.label },
      create: {
        moduleKey: moduleItem.key,
        moduleLabel: moduleItem.label,
        canView: true,
        canCreate: moduleItem.key !== "dashboard" && moduleItem.key !== "auditoria" && moduleItem.key !== "logs",
        canEdit: moduleItem.key !== "dashboard",
        canDelete: moduleItem.key === "usuarios" || moduleItem.key === "perfis",
        canExport: true,
        canImport: moduleItem.key === "usuarios" || moduleItem.key === "backup",
        canConfigure: moduleItem.key === "configuracoes" || moduleItem.key === "administracao",
        canAudit: moduleItem.key === "auditoria" || moduleItem.key === "logs",
        canAdmin: moduleItem.key === "administracao",
      },
    });
  }

  const adminProfile = await prisma.profile.findUnique({
    where: { name: "Administrador" },
  });

  const allPermissions = await prisma.permission.findMany();

  if (adminProfile) {
    for (const permission of allPermissions) {
      await prisma.profilePermission.upsert({
        where: {
          profileId_permissionId: {
            profileId: adminProfile.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          profileId: adminProfile.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@avg.local" },
    update: {
      status: "ATIVO",
      profileId: adminProfile?.id,
    },
    create: {
      firstName: "Admin",
      lastName: "Sistema",
      cpf: "00000000000",
      email: "admin@avg.local",
      phone: "31999999999",
      roleTitle: "Administrador",
      department: "Administração",
      costCenter: "CC-ADM-001",
      project: "Projeto Administração",
      registration: "ADM0001",
      passwordHash: "admin123",
      status: "ATIVO",
      profileId: adminProfile?.id,
      notes: "Usuário inicial do sistema",
    },
  });

  await prisma.systemSetting.upsert({
    where: { id: "default-system-settings" },
    update: {
      companyName: "Grupo AVG",
      systemName: "Gestão de Centro de Custo",
      language: "pt-BR",
      currency: "BRL",
      dateFormat: "dd/MM/yyyy",
      theme: "light",
      emailFrom: "noreply@avg.local",
      databaseName: "postgres",
      alertsConfig: {
        usuarioBloqueado: true,
        senhaExpirada: true,
        tentativaInvasao: true,
        falhaLogin: true,
        backupFalhou: true,
        bancoIndisponivel: true,
      },
    },
    create: {
      id: "default-system-settings",
      companyName: "Grupo AVG",
      systemName: "Gestão de Centro de Custo",
      language: "pt-BR",
      currency: "BRL",
      dateFormat: "dd/MM/yyyy",
      theme: "light",
      emailFrom: "noreply@avg.local",
      databaseName: "postgres",
      alertsConfig: {
        usuarioBloqueado: true,
        senhaExpirada: true,
        tentativaInvasao: true,
        falhaLogin: true,
        backupFalhou: true,
        bancoIndisponivel: true,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      module: "administracao",
      screen: "seed",
      action: "SEED_EXECUTED",
      ipAddress: "127.0.0.1",
      device: "local",
      oldValue: {},
      newValue: { message: "Seed inicial executada" },
    },
  });

  await prisma.systemLog.create({
    data: {
      userId: adminUser.id,
      level: "INFO",
      event: "SEED",
      message: "Seed inicial concluída",
      metadata: { module: "administracao" },
    },
  });

  await prisma.backupJob.create({
    data: {
      type: "MANUAL",
      status: "PENDENTE",
      fileName: "backup-inicial.sql",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
