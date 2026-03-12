module.exports=[191633,660906,e=>{"use strict";e.i(889228);var t=e.i(91601);class a extends Error{code;details;constructor(e,t,a){super(t),this.code=e,this.details=a,this.name="AIError"}}e.s(["AIError",()=>a],660906);var r=e.i(469719),s=e.i(207064);let n=r.z.object({type:r.z.literal("FLASHCARD"),front:r.z.string(),back:r.z.string()}),o=r.z.object({type:r.z.literal("MC"),question:r.z.string(),options:r.z.array(r.z.string()),answer:r.z.string(),explanation:r.z.string().optional()}),i=r.z.object({type:r.z.literal("GAP"),text:r.z.string(),answers:r.z.array(r.z.string())}),l=r.z.object({type:r.z.literal("TRUE_FALSE"),statement:r.z.string(),answer:r.z.enum(["True","False"]),explanation:r.z.string().optional()});r.z.object({items:r.z.array(r.z.union([n,o,i,l]))});let c=r.z.object({isValid:r.z.boolean(),feedback:r.z.string().optional()}),u=r.z.object({questionText:r.z.string(),solution:r.z.string(),isQuestionPresent:r.z.boolean(),isReadable:r.z.boolean(),hasMultipleQuestions:r.z.boolean()}),d=r.z.object({title:r.z.string(),content:r.z.string(),peekingQuestion:r.z.object({question:r.z.string(),options:r.z.array(r.z.string()),answer:r.z.string(),explanation:r.z.string()}).optional()}),m=r.z.object({items:r.z.array(r.z.any())});class p{name="OpenAI";client;constructor(){this.client=new t.default({apiKey:process.env.GROQ_API_KEY,baseURL:"https://api.groq.com/openai/v1"})}async generateContent(e,t,r,n,o="tr"){if(!process.env.GROQ_API_KEY)throw new a("AUTH_ERROR","Groq API key is missing. Please add GROQ_API_KEY to your env.");let i=e.length>200,l=-1===r?"Determine the optimal number of items to generate based on the density of the provided text (minimum 3, maximum 30).":`Generate exactly ${r} study items.`,u="Extract content evenly and comprehensively across the provided text.";"detailed"===n?u="Perform a deep, granular extraction. Focus on very specific details, intricate facts, and subtle nuances described in the text.":"key_concepts"===n?u="Focus heavily on the most emphasized, bolded, or repeated core concepts. Ignore minor details and prioritize major themes and definitions.":"summary"===n?u="Provide a high-level summary extraction. Focus on the overarching narrative and broad takeaways rather than specific data points.":"auto"===n&&(u="Autonomously determine the best extraction strategy based on the tone and structure of the provided text.");let d=`
            You are an expert educational content generator.
            ${i?"Your task is to EXTRACT key concepts from the following user notes/documents and turn them into study items.":"Your task is to GENERATE study items about the following topic."}
            
            Extraction Focus / Strategy: 
            ${u}

            IMPORTANT: You MUST return all content and items within the JSON in this language: ${o.toUpperCase()}. If it is 'tr', translate and write entirely in Turkish.

            Instruction: ${l}
            Types to generate: ${t.join(", ")}.
            
            Return JSON in this format:
            {
                "items": [
                    { "type": "TYPE", "content": { ... }, "sourceContext": "optional short quote/concept source" }
                ]
            }
        `,p=[],h="",g=crypto.randomUUID();for(let r=0;r<=1;r++){let n=h?`${d}

PREVIOUS ATTEMPT FEEDBACK: The previous generation had issues. Please fix them. Feedback: ${h}`:d;try{let a,o,u,d=(await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:n},{role:"user",content:i?`Extract from this content:

${e}`:`Generate content for topic: ${e}`}],response_format:{type:"json_object"}})).choices[0].message.content||"{}";try{a=JSON.parse(d),o=m.parse(a)}catch(e){throw await s.default.systemLog.create({data:{requestId:g,level:"ERROR",environment:"production",service:"ai",message:`JSON Parsing veya Schema Doğrulama Hatası (Attempt ${r})`,source:"SERVER",metadata:{attempt:r,rawResponse:d,error:e.message}}}).catch(()=>{}),e}if(p=o.items,1===r){console.log("[Checker AI] Max retries reached. Returning generated items.");break}let y=`
                    You are an elite educational content reviewer (Checker AI).
                    Your job is to review the generated study items against the user's original ${i?"source text":"topic"}.
                    
                    Original Input:
                    ${e}

                    Requirements:
                    1. Items must be directly relevant and factually accurate based on the original input.
                    2. Count constraints must be met (Instruction: ${l}).
                    3. Types requested must be honored (${t.join(", ")}).
                    
                    Respond ONLY in JSON format:
                    {
                        "isValid": boolean,
                        "feedback": "string, leave empty if true. if false, clearly list mistakes and precise instructions on what to change."
                    }
                `,f=await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:y},{role:"user",content:`Review these generated items:

${JSON.stringify(p,null,2)}`}],response_format:{type:"json_object"}});try{let e=JSON.parse(f.choices[0].message.content||"{}");u=c.parse(e)}catch(e){console.warn(`[Checker AI] Malfunctioned or output invalid JSON on attempt ${r}. Forcing retry.`),u={isValid:!1,feedback:"The evaluation system could not process your output. Please ensure strict JSON compliance and factual accuracy."}}if(await s.default.systemLog.create({data:{requestId:g,level:u.isValid?"INFO":"WARN",environment:"production",service:"ai",message:u.isValid?`AI Generation Loop Completed Successfully (Attempt ${r})`:`Checker AI Requested Adjustments (Attempt ${r})`,source:"SERVER",metadata:{attempt:r,isExtraction:i,generatorInput:e,generatorSystemPrompt:n,generatorOutput:p,checkerFeedback:u.feedback||"Valid"}}}).catch(e=>console.error("AI Logging Failed:",e)),u.isValid){console.log(`[Checker AI] Content approved on attempt ${r}.`);break}console.log(`[Checker AI] Content rejected on attempt ${r}. Feedback:`,u.feedback),h=u.feedback||"Generated items did not meet quality standards. Completely rewrite them."}catch(e){if(console.error(`OpenAI Generation Error (Attempt ${r}):`,e),await s.default.systemLog.create({data:{requestId:g,level:"ERROR",environment:"production",service:"ai",message:`Generator Loop Crashed (Attempt ${r})`,source:"SERVER",stack:e.stack,metadata:{attempt:r,errorMessage:e.message}}}).catch(()=>{}),1===r)throw new a("UNKNOWN",e.message||"AI generation failed after retries");h=`Previous generation failed with error: ${e.message}. Please generate valid JSON.`}}return p}async generateNote(e,t="tr"){if(!process.env.GROQ_API_KEY)throw new a("AUTH_ERROR","Groq API key is missing.");let r=`
            You are an expert academic writer and educator.
            Your task is to create a COMPREHENSIVE, HIERARCHICAL, and WELL-STRUCTURED study note based on the provided topic or text.
            
            Format requirements:
            1. Use clean HTML structure (h1, h2, h3, p, ul, li, strong, blockquote).
            2. Organize content logically with clear headings.
            3. Include definitions for key terms.
            4. If the input is large, synthesize it into a clear narrative.
            5. IMPORTANT: You MUST write entirely in this language: ${t.toUpperCase()}. If 'tr', use natural academic Turkish.
            
            Respond ONLY with the HTML content of the note. No extra chat.
        `,n="",o="",i=crypto.randomUUID();for(let l=0;l<=1;l++){let u=o?`${r}

PREVIOUS ATTEMPT FEEDBACK: The previous note had issues. Please fix them. Feedback: ${o}`:r;try{if(n=(await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:u},{role:"user",content:`Generate a study note for: ${e}`}],temperature:.5})).choices[0].message.content||"",1===l)break;let a=`
                    You are an elite educational content reviewer.
                    Review the generated study note against the original input.
                    
                    Original Input:
                    ${e}

                    Requirements:
                    1. Must be factually accurate and cover the main points.
                    2. Must be in ${t.toUpperCase()}.
                    3. Must use hierarchical HTML tags correctly.
                    
                    Respond ONLY in JSON format:
                    {
                        "isValid": boolean,
                        "feedback": "string, leave empty if true. if false, clearly list mistakes."
                    }
                `,r=await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:a},{role:"user",content:`Review this note:

${n}`}],response_format:{type:"json_object"}}),d=JSON.parse(r.choices[0].message.content||"{}"),m=c.parse(d);if(await s.default.systemLog.create({data:{requestId:i,level:m.isValid?"INFO":"WARN",environment:"production",service:"ai",message:m.isValid?`Note Generated Successfully (Attempt ${l})`:`Note Evaluator Requested Changes (Attempt ${l})`,source:"SERVER",metadata:{attempt:l,feedback:m.feedback}}}).catch(()=>{}),m.isValid)break;o=m.feedback||"Improve the structure and clarity."}catch(e){if(console.error(`Note Generation Error (Attempt ${l}):`,e),1===l)throw new a("UNKNOWN",e.message);o=`Error occurred: ${e.message}. Please try again.`}}return n}async analyzeImage(e,t,r="tr"){if(!process.env.GROQ_API_KEY)throw new a("AUTH_ERROR","Groq API key is missing. Please add GROQ_API_KEY to your env.");let s=e.toString("base64"),n=`
            You are an elite educational tutor. Analyze the image and provide the question text and solution.
            
            IMPORTANT: Provide the "questionText" and "solution" natively in this language: ${r.toUpperCase()}. If it is 'tr', output them strictly in Turkish.
            
            Respond ONLY in JSON format:
            {
                "questionText": "...",
                "solution": "...",
                "isQuestionPresent": true/false,
                "isReadable": true/false,
                "hasMultipleQuestions": true/false
            }
        `;try{let e=await this.client.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:n},{role:"user",content:[{type:"text",text:"Analyze and solve the question in this image."},{type:"image_url",image_url:{url:`data:${t};base64,${s}`,detail:"high"}}]}],response_format:{type:"json_object"}}),r=JSON.parse(e.choices[0].message.content||"{}"),o=u.parse(r);if(!o.isReadable)throw new a("VISION_FAILED","Image is not readable");if(!o.isQuestionPresent)throw new a("VISION_FAILED","No question found in image");return{questionText:o.questionText,solution:o.solution,metadata:{hasMultipleQuestions:o.hasMultipleQuestions}}}catch(e){if(e instanceof a)throw e;throw console.error("OpenAI Vision Error:",e),new a("UNKNOWN",e.message||"Vision analysis failed")}}async generateJourneySlide(e,t,r,n="tr"){if(!process.env.GROQ_API_KEY)throw new a("AUTH_ERROR","Groq API key is missing. Please add GROQ_API_KEY to your env.");let o=`
            You are an expert tutor creating an interactive learning module.
            Your task is to generate ONE comprehensive learning slide (section) about "${e}" which is part of the broader subject "${t}".
            The requested depth is "${r}".
            
            IMPORTANT RULES FOR LANGUAGE:
            1. You MUST generate all text content EXCLUSIVELY in the following language: ${n.toUpperCase()}.
            2. If the language is 'tr' (Turkish), you must write PURELY in Turkish without any mixed English terms.
            3. DO NOT mix languages (e.g., do not write "temeldefinitionsını").
            4. ABSOLUTELY NO Chinese, Japanese, or any other foreign characters/alphabets. Output must be clean and grammatically perfect.
            
            Requirements:
            1. Provide a clear, engaging "title" for the slide.
            2. Write the "content" in rich HTML format. Use semantic tags (<h2>, <p>, <ul>, <li>, <strong>, <em>).
            3. Provide a "peekingQuestion". This is a single multiple-choice question to test user's understanding.
            
            Respond ONLY in valid JSON matching the schema.
        `,i=null,l="",u=crypto.randomUUID();for(let r=0;r<=1;r++){let m=l?`${o}

PREVIOUS ATTEMPT FEEDBACK: The previous slide had issues. Please fix them. Feedback: ${l}`:o;try{let a=(await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:m},{role:"user",content:`Generate the slide for topic: ${e}`}],response_format:{type:"json_object"}})).choices[0].message.content||"{}";if(i=d.parse(JSON.parse(a)),1===r)break;let o=`
                    You are an elite educational content reviewer.
                    Review the generated slide for quality, accuracy, and tone.
                    
                    Subject: ${t} -> ${e}
                    Language: ${n.toUpperCase()}
                    
                    Requirements:
                    1. Must be factually accurate and relevant.
                    2. Must be in ${n.toUpperCase()}.
                    3. JSON must be valid.
                    
                    Respond ONLY in JSON format:
                    {
                        "isValid": boolean,
                        "feedback": "string, leave empty if true."
                    }
                `,p=await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:o},{role:"user",content:`Review this slide:

${JSON.stringify(i,null,2)}`}],response_format:{type:"json_object"}}),h=c.parse(JSON.parse(p.choices[0].message.content||"{}"));if(await s.default.systemLog.create({data:{requestId:u,level:h.isValid?"INFO":"WARN",environment:"production",service:"ai",message:h.isValid?`Slide Generated Successfully (Attempt ${r})`:`Slide Evaluator Requested Changes (Attempt ${r})`,source:"SERVER",metadata:{attempt:r,feedback:h.feedback}}}).catch(()=>{}),h.isValid)break;l=h.feedback||"Improve the content quality and clarity."}catch(e){if(console.error(`Slide Generation Error (Attempt ${r}):`,e),1===r)throw new a("UNKNOWN",e.message);l=`Error occurred: ${e.message}. Please generate valid JSON.`}}if(!i)throw new a("UNKNOWN","Slide generation failed");return i}}e.s(["OpenAIAIProvider",()=>p],191633)}];

//# sourceMappingURL=apps_web_domains_ai_openai_provider_ts_9114090b._.js.map