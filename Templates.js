Template = {
  "subid": "campaign-identifier",
  "name": "campaign-name", 
  "domain": "domain-for-router",
  "affiliateLink": "affiliate-destination-url",
  "whitehatURL": "alternative-whitehat-url"
}

settings_user = {
  username: CONFIG.ADMIN.USERNAME,
  password: CONFIG.ADMIN.PASSWORD,
  created: Date.now()
}

settings_timeout = {
  created: Date.now(),
  expires: Date.now() + CONFIG.CSRF_EXPIRY * 1000
}

settings_routing = {
  tikTokRouting: true
}

campaigns_sub_id = {
  id: "campaignId",
  name: "name",
  subid: "subid",
  domain: "domain",
  redirectMethod: "redirectMethod",
  templateId: "templateId",
  googleFormTemplateId: "googleFormTemplateId",
  affiliateLink: "affiliateLink",
  googleFormAffiliateLink: "googleFormAffiliateLink",
  tikTokRoutingEnabled: "tikTokRoutingEnabled",
  allowedRegions: "allowedRegions",
  whitehatTemplateId: "whitehatTemplateId",
  whitehatURL: "whitehatURL",
  whitehatBehavior: "whitehatBehavior",
  active: "active",
  created: Date.now(),
  updated: Date.now(),
  stats: {
    visits: 0,
    conversions: 0,
    tikTokVisits: 0,
    tikTokConversions: 0,
    googleFormVisits: 0
  }
}

campaigns_index = [
  {
    id: campaign.id,
    subid: campaign.subid,
    name: campaign.name,
    active: campaign.active,
    redirectMethod: campaign.redirectMethod,
    created: campaign.created
  },
]

