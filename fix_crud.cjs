const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`      case 'survey.survey':
        return [
          { id: 1, name: 'Player Technical Evaluation - Q3', state: 'open', category_id: [1, 'Technical Skills'] },
          { id: 2, name: 'Pre-Season Fitness Survey', state: 'closed', category_id: [2, 'Physical Conditioning'] },
          { id: 3, name: 'Match Performance Review', state: 'open', category_id: [3, 'Match Analysis'] }
        ];
      case 'hr.evaluation':
        return [
          { id: 1, name: 'Q3 Assessment: John Doe', state: 'done', category_id: [1, 'Midfielder'] },
          { id: 2, name: 'Physical Test: Jane Smith', state: 'in_progress', category_id: [2, 'Defender'] },
          { id: 3, name: 'Trial Review: Alex Johnson', state: 'draft', category_id: [3, 'Striker'] }
        ];`,
`      case 'survey.survey':
        return [
          { id: 1, title: 'Player Technical Evaluation - Q3', active: true, access_mode: 'public', description: 'Evaluate player technical skills', answer_count: 42, scoring_type: 'scoring_with_answers' },
          { id: 2, title: 'Pre-Season Fitness Survey', active: false, access_mode: 'token', description: 'Assess preseason physical conditioning', answer_count: 28, scoring_type: 'no_scoring' },
          { id: 3, title: 'Match Performance Review', active: true, access_mode: 'public', description: 'Post-match performance tracking', answer_count: 15, scoring_type: 'scoring_without_answers' }
        ];
      case 'survey.user_input':
        return [
          { id: 1, survey_id: [1, 'Player Technical Evaluation - Q3'], partner_id: [101, 'Budi Santoso'], scoring_total: 85, scoring_success: true, state: 'done', create_date: '2026-08-20 10:00:00' },
          { id: 2, survey_id: [2, 'Pre-Season Fitness Survey'], partner_id: [102, 'Siti Rahma'], scoring_total: 92, scoring_success: true, state: 'done', create_date: '2026-08-21 14:30:00' },
          { id: 3, survey_id: [1, 'Player Technical Evaluation - Q3'], partner_id: [103, 'CV Logistik Maju'], scoring_total: 45, scoring_success: false, state: 'in_progress', create_date: '2026-08-21 16:00:00' }
        ];`
);

code = code.replace(
`        case 'fleet.vehicle': return ['id', 'name', 'model_id', 'license_plate'];
        default: return ['id', 'display_name', 'name'];`,
`        case 'fleet.vehicle': return ['id', 'name', 'model_id', 'license_plate'];
        case 'survey.survey': return ['id', 'title', 'active', 'access_mode', 'description', 'answer_count', 'scoring_type'];
        case 'survey.user_input': return ['id', 'survey_id', 'partner_id', 'scoring_total', 'scoring_success', 'state', 'create_date'];
        default: return ['id', 'display_name', 'name'];`
);

code = code.replace(
`      if (search) {
         domain.push(['name', 'ilike', search]);
      }`,
`      if (search) {
         if (menu.model === 'survey.survey') {
            domain.push(['title', 'ilike', search]);
         } else if (menu.model === 'survey.user_input') {
            // Fallback for user_input
            domain.push(['survey_id', 'ilike', search]);
         } else {
            domain.push(['name', 'ilike', search]);
         }
      }`
);

fs.writeFileSync(path, code);
