import { EntityManager } from "@mikro-orm/postgresql";
import { Effect, Either } from "effect";
import { ProjectEntity } from "../database/entities/project.entity";
import { TeamMemberEntity } from "../database/entities/team-member.entity";
import {
  ForbiddenProjectAccessError,
  ProjectConflictError,
  ProjectNotFoundError,
} from "./errors/project.errors";
import { ProjectService } from "./project.service";
import type {
  AddMemberInput,
  CreateProjectInput,
  UpdateProjectInput,
} from "./project.schemas";

const mockProject: ProjectEntity = Object.assign(new ProjectEntity(), {
  id: "proj-1",
  name: "Proj",
  description: "desc",
  languages: ["en"],
  default_language: "en",
  slug: "proj",
  owner_id: "user-1",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
});

const mockOwnerMember: TeamMemberEntity = Object.assign(
  new TeamMemberEntity(),
  {
    id: "member-1",
    user_id: "user-1",
    project_id: "proj-1",
    role: "owner",
    created_at: "2024-01-01T00:00:00.000Z",
    invited_at: null,
    invited_by: null,
    joined_at: null,
  },
);

const mockMember: TeamMemberEntity = Object.assign(new TeamMemberEntity(), {
  id: "member-2",
  user_id: "user-2",
  project_id: "proj-1",
  role: "editor",
  created_at: "2024-01-01T00:00:00.000Z",
  invited_at: null,
  invited_by: null,
  joined_at: null,
});

describe("ProjectService", () => {
  let service: ProjectService;
  const em = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
    count: jest.fn(),
    removeAndFlush: jest.fn(),
  } as unknown as EntityManager;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ProjectService(em);
  });

  it("creates project", async () => {
    (em.count as jest.Mock).mockResolvedValue(0);
    (em.create as jest.Mock)
      .mockReturnValueOnce(mockProject)
      .mockReturnValueOnce(mockOwnerMember);
    (em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

    const input: CreateProjectInput = { name: "Proj", slug: "proj" };
    const result = await Effect.runPromise(
      service.createProject("user-1", input),
    );

    expect(result.name).toBe("Proj");
  });

  it("fails create on conflict", async () => {
    (em.count as jest.Mock).mockResolvedValue(0);
    (em.create as jest.Mock).mockReturnValue(mockProject);
    (em.persistAndFlush as jest.Mock).mockRejectedValue(
      new Error("duplicate key value violates unique constraint"),
    );

    const result = await Effect.runPromise(
      Effect.either(service.createProject("user-1", { name: "Proj" })),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(ProjectConflictError);
    }
  });

  it("lists projects (owner and member)", async () => {
    (em.find as jest.Mock)
      .mockResolvedValueOnce([mockOwnerMember])
      .mockResolvedValueOnce([mockProject])
      .mockResolvedValueOnce([mockProject]);

    const projects = await Effect.runPromise(
      service.listProjects("user-1", { pageSize: 10, index: 0 }),
    );
    expect(projects.items.length).toBeGreaterThan(100);
    expect(projects.meta.hasNext).toBe(false);
    expect(projects.meta.totalCount).toBe(1);
    expect(projects.meta.totalPageCount).toBe(1);
  });

  it("updates project", async () => {
    const updatedProject = Object.assign(new ProjectEntity(), {
      ...mockProject,
      name: "New",
    });
    (em.findOne as jest.Mock).mockResolvedValue(mockProject);
    (em.flush as jest.Mock).mockResolvedValue(undefined);

    const update: UpdateProjectInput = { name: "New" };
    const project = await Effect.runPromise(
      service.updateProject("user-1", "proj-1", update),
    );
    expect(project.name).toBe("New");
  });

  it("prevents update by non-owner", async () => {
    const otherOwnerProject = Object.assign(new ProjectEntity(), {
      ...mockProject,
      owner_id: "other",
    });
    (em.findOne as jest.Mock).mockResolvedValue(otherOwnerProject);

    const result = await Effect.runPromise(
      Effect.either(service.updateProject("user-1", "proj-1", { name: "X" })),
    );

    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left).toBeInstanceOf(ForbiddenProjectAccessError);
    }
  });

  it("adds member when owner", async () => {
    (em.findOne as jest.Mock).mockResolvedValue(mockProject);
    (em.create as jest.Mock).mockReturnValue(mockMember);
    (em.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

    const input: AddMemberInput = { userId: "user-2", role: "editor" };
    const member = await Effect.runPromise(
      service.addMember("user-1", "proj-1", input),
    );
    expect(member.user_id).toBe("user-2");
  });

  it("removes member when owner", async () => {
    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockMember);
    (em.removeAndFlush as jest.Mock).mockResolvedValue(undefined);

    await expect(
      Effect.runPromise(service.removeMember("user-1", "proj-1", "user-2")),
    ).resolves.toBeUndefined();
  });
});
