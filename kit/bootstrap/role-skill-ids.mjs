#!/usr/bin/env node
/**
 * Engagement profiles (coach vs delivery) and role skill id resolution.
 */

export const ENGAGEMENT_PROFILES = ["coach", "delivery"];
export const DELIVERY_SKILL_SUFFIX = "-delivery";
export const ORCHESTRATOR_ROLE = "id2s-role-project-manager";

/**
 * @param {string | null | undefined} value
 * @returns {"coach" | "delivery"}
 */
export function normalizeEngagementProfile(value) {
  const v = String(value ?? "coach")
    .trim()
    .toLowerCase();
  if (v === "delivery") return "delivery";
  return "coach";
}

/**
 * @param {string} skillId
 */
export function isDeliverySkillId(skillId) {
  return (
    typeof skillId === "string" &&
    skillId.startsWith("id2s-role-") &&
    skillId.endsWith(DELIVERY_SKILL_SUFFIX)
  );
}

/**
 * Base role id without delivery suffix.
 * @param {string} skillId
 */
export function baseRoleSkillId(skillId) {
  if (!skillId) return skillId;
  if (isDeliverySkillId(skillId)) {
    return skillId.slice(0, -DELIVERY_SKILL_SUFFIX.length);
  }
  return skillId;
}

/**
 * @param {string} baseSkillId
 */
export function deliverySkillId(baseSkillId) {
  const base = baseRoleSkillId(baseSkillId);
  if (!base || base === ORCHESTRATOR_ROLE) {
    throw new Error(`Cannot create delivery skill for: ${baseSkillId}`);
  }
  if (isDeliverySkillId(base)) return base;
  return `${base}${DELIVERY_SKILL_SUFFIX}`;
}

/**
 * Skill id to invoke for the given base role and profile.
 * @param {string} baseRoleSkill
 * @param {string | null | undefined} profile
 */
export function assignedRoleSkillId(baseRoleSkill, profile) {
  const base = baseRoleSkillId(baseRoleSkill);
  if (!base) return null;
  if (base === ORCHESTRATOR_ROLE) return ORCHESTRATOR_ROLE;
  return normalizeEngagementProfile(profile) === "delivery"
    ? deliverySkillId(base)
    : base;
}

/**
 * @param {object} stepLike — catalog step or resolved step
 */
export function engagementProfileFromStep(stepLike) {
  return normalizeEngagementProfile(stepLike?.engagement_profile);
}

/**
 * Enrich binding / sequence entry with profile + assigned skill.
 * @param {object} entry — must include primary_role_skill (base)
 * @param {string | null | undefined} [profileOverride]
 */
export function enrichRoleAssignment(entry, profileOverride) {
  const base = baseRoleSkillId(entry.primary_role_skill);
  const profile = normalizeEngagementProfile(profileOverride ?? entry.engagement_profile);
  const assigned = assignedRoleSkillId(base, profile);
  return {
    ...entry,
    primary_role_skill: base,
    engagement_profile: profile,
    assigned_role_skill: assigned,
  };
}

/**
 * Preserve runtime engagement_profile overrides when rebinding active steps.
 * @param {object[]} freshBindings
 * @param {object[] | null | undefined} existingBindings
 */
export function mergeActiveBindings(freshBindings, existingBindings) {
  if (!existingBindings?.length) return freshBindings;
  const prevByStep = Object.fromEntries(existingBindings.map((b) => [b.step_id, b]));
  return (freshBindings || []).map((fresh) => {
    const prev = prevByStep[fresh.step_id];
    if (!prev) return fresh;
    const profile = prev.engagement_profile ?? fresh.engagement_profile;
    return enrichRoleAssignment(fresh, profile);
  });
}
